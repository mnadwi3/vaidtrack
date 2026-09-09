<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Core\Controller;
use App\Repositories\FaqRepository;
use App\Repositories\SiteSettingRepository;
use App\Repositories\TestimonialRepository;
use App\Services\DoctorService;
use App\Services\HospitalService;
use App\Services\SettingsService;
use App\Services\SpecialtyService;
use App\Services\TreatmentService;

/**
 * Unauthenticated read-only JSON endpoints that let the static frontend
 * stay in sync with content managed in the admin panel.
 */
final class PublicContentController extends Controller
{
    private TreatmentService $treatments;
    private HospitalService $hospitals;
    private DoctorService $doctors;
    private SpecialtyService $specialties;
    private TestimonialRepository $testimonials;
    private FaqRepository $faqs;
    private SiteSettingRepository $settings;
    private SettingsService $settingsService;
    /** @var array<int, list<string>> */
    private array $hospitalAccreditations = [];

    public function __construct(
        ?TreatmentService $treatments = null,
        ?HospitalService $hospitals = null,
        ?DoctorService $doctors = null,
        ?SpecialtyService $specialties = null,
        ?TestimonialRepository $testimonials = null,
        ?FaqRepository $faqs = null,
        ?SiteSettingRepository $settings = null,
        ?SettingsService $settingsService = null
    ) {
        $this->treatments = $treatments ?? new TreatmentService();
        $this->hospitals = $hospitals ?? new HospitalService();
        $this->doctors = $doctors ?? new DoctorService();
        $this->specialties = $specialties ?? new SpecialtyService();
        $this->testimonials = $testimonials ?? new TestimonialRepository();
        $this->faqs = $faqs ?? new FaqRepository();
        $this->settings = $settings ?? new SiteSettingRepository();
        $this->settingsService = $settingsService ?? new SettingsService();
    }

    public function treatmentsList(): void
    {
        $rows = $this->treatments->list(['status' => 'active', 'per_page' => 100])['treatments'];
        $this->cached($this->mapList($rows, [$this, 'mapTreatment']));
    }

    public function specialtiesList(): void
    {
        $rows = $this->specialties->list(['status' => 'active', 'per_page' => 100])['specialties'];
        $this->cached($this->mapList($rows, [$this, 'mapSpecialty']));
    }

    public function treatmentBySlug(string $slug): void
    {
        header('Access-Control-Allow-Origin: *');
        $treatment = $this->treatments->findBySlug($slug);
        if ($treatment === null) {
            $this->json(['error' => 'Not found'], 404);
        }
        $this->cached($this->mapTreatment($treatment));
    }

    public function hospitalsList(): void
    {
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 100)));
        $result = $this->hospitals->list(['status' => 'active', 'page' => $page, 'per_page' => $perPage]);
        $rows = $result['hospitals'];
        $ids = array_map(static fn (array $row): int => (int) $row['id'], $rows);
        $this->hospitalAccreditations = $this->hospitals->accreditationCodesByHospitalIds($ids);
        $items = $this->mapList($rows, [$this, 'mapHospital']);
        $this->cached([
            'items' => $items,
            'page' => $page,
            'per_page' => $perPage,
            'total' => $result['paginator']->total ?? count($items),
            'has_more' => $page * $perPage < ($result['paginator']->total ?? count($items)),
        ]);
    }

    public function hospitalBySlug(string $slug): void
    {
        header('Access-Control-Allow-Origin: *');
        $hospital = $this->hospitals->findBySlug($slug);
        if ($hospital === null) {
            $this->json(['error' => 'Not found'], 404);
        }
        $this->hospitalAccreditations = $this->hospitals->accreditationCodesByHospitalIds([(int) $hospital['id']]);
        $mapped = $this->mapHospital($hospital);
        $page = $hospital['page'] ?? [];
        $mapped['about_html'] = $page['about'] ?? null;
        $mapped['hero_image_alt'] = $page['hero_image_alt'] ?? $mapped['name'];
        $mapped['website'] = $page['website'] ?? null;
        $mapped['quick_facts'] = array_map(
            static fn (array $f): array => [
                'code' => $f['code'],
                'label' => $f['label'],
                'value' => $f['value'],
                'icon' => $f['icon'] !== '' ? asset($f['icon']) : null,
            ],
            $page['quick_facts'] ?? []
        );
        $mapped['specialties'] = array_map(
            fn (array $s): array => [
                'id' => $s['id'],
                'slug' => $s['slug'],
                'name' => $s['name'],
                'icon' => !empty($s['icon']) ? $this->imageUrl($s['icon']) : null,
            ],
            $page['related_specialties'] ?? []
        );
        $mapped['doctors'] = array_map(
            fn (array $d): array => [
                'id' => (int) $d['id'],
                'slug' => $d['slug'],
                'name' => $d['name'],
                'photo' => $this->imageUrl($d['photo'] ?? null),
                'qualification' => $d['qualification'] ?? null,
                'expertise' => $d['expertise'] ?? null,
            ],
            $page['featured_doctors'] ?? []
        );
        $mapped['related_treatments'] = array_map(
            fn (array $t): array => [
                'id' => (int) $t['id'],
                'slug' => $t['slug'],
                'name' => $t['name'],
                'image' => $this->imageUrl($t['featured_image'] ?? null),
            ],
            $page['related_treatments'] ?? []
        );
        $mapped['seo'] = $page['seo'] ?? null;
        $this->cached($mapped);
    }

    public function doctorsList(): void
    {
        $filters = ['status' => 'active', 'per_page' => 200];
        if (!empty($_GET['specialty_id'])) {
            $filters['specialty_id'] = (int) $_GET['specialty_id'];
        }
        if (!empty($_GET['treatment_id'])) {
            $filters['treatment_id'] = (int) $_GET['treatment_id'];
        }
        $rows = $this->doctors->list($filters)['doctors'];
        $this->cached($this->mapList($rows, [$this, 'mapDoctor']));
    }

    public function testimonialsList(): void
    {
        $rows = $this->testimonials->active();
        $this->cached($this->mapList($rows, [$this, 'mapTestimonial']));
    }

    public function faqsList(): void
    {
        $rows = $this->faqs->active();
        $this->cached($this->mapList($rows, [$this, 'mapFaq']));
    }

    public function hero(): void
    {
        $hero = $this->settings->get('hero') ?? [];
        $hero['image'] = $this->imageUrl($hero['image'] ?? null);
        $this->cached($hero);
    }

    /** @param array<int, array<string, mixed>> $rows */
    private function mapList(array $rows, callable $mapper): array
    {
        return array_map($mapper, $rows);
    }

    private function mapSpecialty(array $s): array
    {
        return [
            'id' => (int) $s['id'],
            'slug' => (string) $s['slug'],
            'name' => (string) $s['name'],
            'description' => $s['description'] ?? null,
            'image' => $this->imageUrl($s['image'] ?? null),
            'url' => '/specialities/' . $s['slug'],
        ];
    }

    private function mapTreatment(array $t): array
    {
        return [
            'id' => (int) $t['id'],
            'slug' => (string) $t['slug'],
            'name' => (string) $t['name'],
            'category' => $t['category'] ?? null,
            'specialty' => $t['specialty_name'] ?? null,
            'price_from' => $t['price_from'] ?? null,
            'overview' => $t['overview'] ?? null,
            'symptoms' => $t['symptoms'] ?? null,
            'when_needed' => $t['when_needed'] ?? null,
            'procedure_overview' => $t['procedure_overview'] ?? null,
            'recovery' => $t['recovery'] ?? null,
            'why_choose' => $t['why_choose'] ?? null,
            'is_featured' => (bool) ($t['is_featured'] ?? false),
            'image' => $this->imageUrl($t['featured_image'] ?? null),
            'seo_title' => $t['seo_title'] ?? $t['name'],
            'seo_description' => $t['seo_description'] ?? null,
            'url' => '/treatments/' . $t['slug'],
        ];
    }

    private function mapHospital(array $h): array
    {
        $location = implode(', ', array_filter([
            trim((string) ($h['city'] ?? '')),
            trim((string) ($h['state'] ?? '')),
            trim((string) ($h['country'] ?? '')),
        ], static fn (string $part): bool => $part !== ''));

        $accreditationCodes = $this->hospitalAccreditations[(int) $h['id']] ?? [];
        $accreditationTypes = $this->settingsService->getAccreditationTypesMap();
        $accreditationLogos = array_values(array_filter(array_map(
            function (string $code) use ($accreditationTypes): ?array {
                $meta = $accreditationTypes[$code] ?? null;
                if ($meta === null || empty($meta['logo'])) {
                    return null;
                }

                return ['code' => $code, 'label' => $meta['label'], 'logo' => $this->imageUrl($meta['logo'])];
            },
            $accreditationCodes
        )));

        return [
            'id' => (int) $h['id'],
            'slug' => (string) $h['slug'],
            'name' => (string) $h['name'],
            'description' => $h['description'] ?? $h['about'] ?? null,
            'short_description' => $h['short_description'] ?? null,
            'hero_image_alt' => $h['hero_image_alt'] ?? $h['name'] ?? null,
            'address_line1' => $h['address_line1'] ?? null,
            'address_line2' => $h['address_line2'] ?? null,
            'city' => $h['city'] ?? null,
            'state' => $h['state'] ?? null,
            'country' => $h['country'] ?? null,
            'pincode' => $h['pincode'] ?? null,
            'location' => $location !== '' ? $location : null,
            'logo' => $this->imageUrl($h['logo'] ?? null),
            'cover_image' => $this->imageUrl($h['cover_image'] ?? null),
            'established_year' => $h['established_year'] ?? null,
            'number_of_beds' => $h['number_of_beds'] ?? null,
            'hospital_type' => $h['hospital_type'] ?? null,
            'is_featured' => (bool) ($h['is_featured'] ?? false),
            'is_verified' => (bool) ($h['is_verified'] ?? false),
            'accreditation_logos' => $accreditationLogos,
            'seo_title' => $h['seo_title'] ?? $h['name'],
            'seo_description' => $h['seo_description'] ?? null,
            'url' => '/hospitals/' . rawurlencode((string) $h['slug']),
        ];
    }

    private function mapDoctor(array $d): array
    {
        $expertise = $d['expertise'] ?? $d['experience_summary'] ?? '';
        $expertiseList = is_array($expertise)
            ? $expertise
            : array_values(array_filter(array_map('trim', preg_split('/[|,]/', (string) $expertise) ?: [])));

        return [
            'id' => (int) $d['id'],
            'slug' => (string) $d['slug'],
            'name' => (string) $d['name'],
            'specialty' => $d['designation'] ?? $d['specialty_name'] ?? '',
            'experience' => $d['years_of_experience'] ? $d['years_of_experience'] . ' Years' : '',
            'qualification' => $d['qualification'] ?? '',
            'expertise' => $expertiseList,
            'image' => $this->imageUrl($d['photo'] ?? null),
            'is_featured' => (bool) ($d['is_featured'] ?? false),
            'seo_title' => $d['seo_title'] ?? $d['name'],
            'seo_description' => $d['seo_description'] ?? null,
        ];
    }

    private function mapTestimonial(array $t): array
    {
        return [
            'id' => (int) $t['id'],
            'patient_name' => (string) $t['patient_name'],
            'treatment_name' => $t['treatment_name'] ?? null,
            'quote' => $t['quote'] ?? null,
            'youtube_id' => $t['youtube_id'] ?? null,
            'thumbnail' => $this->imageUrl($t['thumbnail'] ?? null),
        ];
    }

    private function mapFaq(array $f): array
    {
        return [
            'id' => (int) $f['id'],
            'question' => (string) $f['question'],
            'answer' => $f['answer'] ?? '',
        ];
    }

    private function imageUrl(?string $relativePath): ?string
    {
        if ($relativePath === null || $relativePath === '') {
            return null;
        }

        return asset($relativePath);
    }

    /** @param array<string, mixed>|array<int, mixed> $payload */
    private function cached(array $payload): never
    {
        header('Cache-Control: public, max-age=120');
        header('Access-Control-Allow-Origin: *');
        $this->json($payload);
    }
}
