<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Services\HospitalService;
use App\Services\SpecialtyService;
use App\Services\TreatmentService;

/**
 * Serves /sitemap.xml — the fixed static pages plus every live, indexable
 * treatment/specialty/hospital detail page, read straight from the CMS so
 * the sitemap never goes stale as content is added or removed.
 */
final class PublicSitemapController extends Controller
{
    private const BASE_URL = 'https://vaidtrack.com';

    /** @var list<array{path: string, changefreq: string, priority: string}> */
    private const STATIC_PAGES = [
        ['path' => '/', 'changefreq' => 'weekly', 'priority' => '1.0'],
        ['path' => '/all-treatments', 'changefreq' => 'monthly', 'priority' => '0.8'],
        ['path' => '/all-doctors', 'changefreq' => 'monthly', 'priority' => '0.8'],
        ['path' => '/hospitals', 'changefreq' => 'monthly', 'priority' => '0.8'],
        ['path' => '/testimonials', 'changefreq' => 'monthly', 'priority' => '0.7'],
        ['path' => '/about-us', 'changefreq' => 'monthly', 'priority' => '0.7'],
        ['path' => '/faq', 'changefreq' => 'monthly', 'priority' => '0.7'],
        ['path' => '/privacy-policy', 'changefreq' => 'yearly', 'priority' => '0.5'],
        ['path' => '/disclaimer', 'changefreq' => 'yearly', 'priority' => '0.5'],
    ];

    private TreatmentService $treatments;
    private SpecialtyService $specialties;
    private HospitalService $hospitals;

    public function __construct(
        ?TreatmentService $treatments = null,
        ?SpecialtyService $specialties = null,
        ?HospitalService $hospitals = null
    ) {
        $this->treatments = $treatments ?? new TreatmentService();
        $this->specialties = $specialties ?? new SpecialtyService();
        $this->hospitals = $hospitals ?? new HospitalService();
    }

    public function index(): void
    {
        $urls = [];

        foreach (self::STATIC_PAGES as $page) {
            $urls[] = ['loc' => self::BASE_URL . $page['path'], 'lastmod' => null, 'changefreq' => $page['changefreq'], 'priority' => $page['priority']];
        }

        foreach ($this->fetchAllActive($this->treatments, 'treatments') as $t) {
            $urls[] = $this->detailUrl('/treatments/', $t, '0.7');
        }

        foreach ($this->fetchAllActive($this->specialties, 'specialties') as $s) {
            $urls[] = $this->detailUrl('/specialities/', $s, '0.6');
        }

        foreach ($this->fetchAllActive($this->hospitals, 'hospitals') as $h) {
            $urls[] = $this->detailUrl('/hospitals/', $h, '0.7');
        }

        header('Content-Type: application/xml; charset=utf-8');
        header('Cache-Control: public, max-age=3600');
        echo $this->render($urls);
        exit;
    }

    /**
     * Walks every page of an active-content listing (services cap per_page
     * at 100), so this stays correct as the CMS grows past one page.
     *
     * @param object{list: callable(array): array} $service
     * @return list<array<string, mixed>>
     */
    private function fetchAllActive(object $service, string $key): array
    {
        $items = [];
        $page = 1;

        do {
            $result = $service->list(['status' => 'active', 'page' => $page, 'per_page' => 100]);
            foreach ($result[$key] as $row) {
                $items[] = $row;
            }
            $lastPage = $result['paginator']->lastPage();
            $page++;
        } while ($page <= $lastPage);

        return $items;
    }

    /** @param array<string, mixed> $record */
    private function detailUrl(string $prefix, array $record, string $priority): array
    {
        return [
            'loc' => self::BASE_URL . $prefix . rawurlencode((string) $record['slug']),
            'lastmod' => isset($record['updated_at']) ? substr((string) $record['updated_at'], 0, 10) : null,
            'changefreq' => 'monthly',
            'priority' => $priority,
        ];
    }

    /** @param list<array{loc: string, lastmod: ?string, changefreq: string, priority: string}> $urls */
    private function render(array $urls): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($urls as $url) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>' . htmlspecialchars($url['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</loc>\n";
            if ($url['lastmod'] !== null) {
                $xml .= '    <lastmod>' . htmlspecialchars($url['lastmod'], ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</lastmod>\n";
            }
            $xml .= '    <changefreq>' . $url['changefreq'] . "</changefreq>\n";
            $xml .= '    <priority>' . $url['priority'] . "</priority>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }
}
