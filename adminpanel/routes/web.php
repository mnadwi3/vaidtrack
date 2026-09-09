<?php

declare(strict_types=1);

use App\Controllers\Api\PublicContentController;
use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\DoctorController;
use App\Controllers\FaqController;
use App\Controllers\HospitalController;
use App\Controllers\PublicDoctorController;
use App\Controllers\PublicHospitalController;
use App\Controllers\PublicSitemapController;
use App\Controllers\PublicSpecialtyController;
use App\Controllers\PublicTreatmentController;
use App\Controllers\SettingsController;
use App\Controllers\SpecialtyController;
use App\Controllers\TestimonialController;
use App\Controllers\TreatmentController;
use App\Middleware\AuthMiddleware;
use App\Middleware\GuestMiddleware;

/** @var \App\Core\Router $router */

$router->get('/', static function (): void {
    if (\App\Core\Auth::check()) {
        redirect('/dashboard');
    }
    redirect('/login');
});

$router->get('/login', [AuthController::class, 'showLogin'], [GuestMiddleware::class]);
$router->post('/login', [AuthController::class, 'login'], [GuestMiddleware::class]);
$router->post('/logout', [AuthController::class, 'logout'], [AuthMiddleware::class]);
$router->get('/forgot-password', [AuthController::class, 'showForgotPassword'], [GuestMiddleware::class]);
$router->post('/forgot-password', [AuthController::class, 'sendResetLink'], [GuestMiddleware::class]);
$router->get('/reset-password', [AuthController::class, 'showResetPassword'], [GuestMiddleware::class]);
$router->post('/reset-password', [AuthController::class, 'resetPassword'], [GuestMiddleware::class]);

$router->get('/dashboard', [DashboardController::class, 'index'], [AuthMiddleware::class]);
$router->get('/dashboard/data', [DashboardController::class, 'data'], [AuthMiddleware::class]);

$router->get('/doctors', [DoctorController::class, 'index'], [AuthMiddleware::class]);
$router->get('/doctors/create', [DoctorController::class, 'create'], [AuthMiddleware::class]);
$router->post('/doctors', [DoctorController::class, 'store'], [AuthMiddleware::class]);
$router->get('/doctors/import', [DoctorController::class, 'importForm'], [AuthMiddleware::class]);
$router->post('/doctors/import', [DoctorController::class, 'import'], [AuthMiddleware::class]);
$router->get('/doctors/export/csv', [DoctorController::class, 'exportCsv'], [AuthMiddleware::class]);
$router->get('/doctors/export/json', [DoctorController::class, 'exportJson'], [AuthMiddleware::class]);
$router->get('/doctors/export/excel', [DoctorController::class, 'exportExcel'], [AuthMiddleware::class]);
$router->post('/doctors/bulk', [DoctorController::class, 'bulk'], [AuthMiddleware::class]);
$router->get('/doctors/{id}/edit', [DoctorController::class, 'edit'], [AuthMiddleware::class]);
$router->post('/doctors/{id}', [DoctorController::class, 'update'], [AuthMiddleware::class]);
$router->post('/doctors/{id}/delete', [DoctorController::class, 'destroy'], [AuthMiddleware::class]);
$router->post('/doctors/{id}/restore', [DoctorController::class, 'restore'], [AuthMiddleware::class]);
$router->post('/doctors/{id}/duplicate', [DoctorController::class, 'duplicate'], [AuthMiddleware::class]);

$router->get('/doctors/{slug}', [PublicDoctorController::class, 'show']);

$router->get('/treatments', [TreatmentController::class, 'index'], [AuthMiddleware::class]);
$router->get('/treatments/create', [TreatmentController::class, 'create'], [AuthMiddleware::class]);
$router->post('/treatments', [TreatmentController::class, 'store'], [AuthMiddleware::class]);
$router->get('/treatments/import', [TreatmentController::class, 'importForm'], [AuthMiddleware::class]);
$router->post('/treatments/import', [TreatmentController::class, 'import'], [AuthMiddleware::class]);
$router->get('/treatments/export/csv', [TreatmentController::class, 'exportCsv'], [AuthMiddleware::class]);
$router->get('/treatments/export/json', [TreatmentController::class, 'exportJson'], [AuthMiddleware::class]);
$router->get('/treatments/export/excel', [TreatmentController::class, 'exportExcel'], [AuthMiddleware::class]);
$router->post('/treatments/bulk', [TreatmentController::class, 'bulk'], [AuthMiddleware::class]);
$router->get('/treatments/{id}/edit', [TreatmentController::class, 'edit'], [AuthMiddleware::class]);
$router->post('/treatments/{id}', [TreatmentController::class, 'update'], [AuthMiddleware::class]);
$router->post('/treatments/{id}/delete', [TreatmentController::class, 'destroy'], [AuthMiddleware::class]);
$router->post('/treatments/{id}/restore', [TreatmentController::class, 'restore'], [AuthMiddleware::class]);
$router->post('/treatments/{id}/duplicate', [TreatmentController::class, 'duplicate'], [AuthMiddleware::class]);

$router->get('/treatments/{slug}', [PublicTreatmentController::class, 'show']);
$router->get('/specialities/{slug}', [PublicSpecialtyController::class, 'show']);

$router->get('/hospitals', [HospitalController::class, 'index'], [AuthMiddleware::class]);
$router->get('/hospitals/create', [HospitalController::class, 'create'], [AuthMiddleware::class]);
$router->post('/hospitals', [HospitalController::class, 'store'], [AuthMiddleware::class]);
$router->get('/hospitals/import', [HospitalController::class, 'importForm'], [AuthMiddleware::class]);
$router->post('/hospitals/import', [HospitalController::class, 'import'], [AuthMiddleware::class]);
$router->get('/hospitals/export/csv', [HospitalController::class, 'exportCsv'], [AuthMiddleware::class]);
$router->get('/hospitals/export/json', [HospitalController::class, 'exportJson'], [AuthMiddleware::class]);
$router->get('/hospitals/export/excel', [HospitalController::class, 'exportExcel'], [AuthMiddleware::class]);
$router->post('/hospitals/bulk', [HospitalController::class, 'bulk'], [AuthMiddleware::class]);
$router->get('/hospitals/{id}/edit', [HospitalController::class, 'edit'], [AuthMiddleware::class]);
$router->post('/hospitals/{id}', [HospitalController::class, 'update'], [AuthMiddleware::class]);
$router->post('/hospitals/{id}/delete', [HospitalController::class, 'destroy'], [AuthMiddleware::class]);
$router->post('/hospitals/{id}/restore', [HospitalController::class, 'restore'], [AuthMiddleware::class]);
$router->post('/hospitals/{id}/duplicate', [HospitalController::class, 'duplicate'], [AuthMiddleware::class]);

$router->get('/hospitals/{slug}', [PublicHospitalController::class, 'show']);

$router->get('/sitemap.xml', [PublicSitemapController::class, 'index']);

$router->get('/specialties', [SpecialtyController::class, 'index'], [AuthMiddleware::class]);
$router->get('/specialties/create', [SpecialtyController::class, 'create'], [AuthMiddleware::class]);
$router->post('/specialties', [SpecialtyController::class, 'store'], [AuthMiddleware::class]);
$router->get('/specialties/import', [SpecialtyController::class, 'importForm'], [AuthMiddleware::class]);
$router->post('/specialties/import', [SpecialtyController::class, 'import'], [AuthMiddleware::class]);
$router->get('/specialties/export/csv', [SpecialtyController::class, 'exportCsv'], [AuthMiddleware::class]);
$router->get('/specialties/export/json', [SpecialtyController::class, 'exportJson'], [AuthMiddleware::class]);
$router->get('/specialties/export/excel', [SpecialtyController::class, 'exportExcel'], [AuthMiddleware::class]);
$router->post('/specialties/bulk', [SpecialtyController::class, 'bulk'], [AuthMiddleware::class]);
$router->get('/specialties/{id}/edit', [SpecialtyController::class, 'edit'], [AuthMiddleware::class]);
$router->post('/specialties/{id}', [SpecialtyController::class, 'update'], [AuthMiddleware::class]);
$router->post('/specialties/{id}/delete', [SpecialtyController::class, 'destroy'], [AuthMiddleware::class]);
$router->post('/specialties/{id}/restore', [SpecialtyController::class, 'restore'], [AuthMiddleware::class]);

$router->get('/testimonials', [TestimonialController::class, 'index'], [AuthMiddleware::class]);
$router->get('/testimonials/create', [TestimonialController::class, 'create'], [AuthMiddleware::class]);
$router->post('/testimonials', [TestimonialController::class, 'store'], [AuthMiddleware::class]);
$router->get('/testimonials/{id}/edit', [TestimonialController::class, 'edit'], [AuthMiddleware::class]);
$router->post('/testimonials/{id}', [TestimonialController::class, 'update'], [AuthMiddleware::class]);
$router->post('/testimonials/{id}/delete', [TestimonialController::class, 'destroy'], [AuthMiddleware::class]);

$router->get('/faqs', [FaqController::class, 'index'], [AuthMiddleware::class]);
$router->get('/faqs/create', [FaqController::class, 'create'], [AuthMiddleware::class]);
$router->post('/faqs', [FaqController::class, 'store'], [AuthMiddleware::class]);
$router->get('/faqs/{id}/edit', [FaqController::class, 'edit'], [AuthMiddleware::class]);
$router->post('/faqs/{id}', [FaqController::class, 'update'], [AuthMiddleware::class]);
$router->post('/faqs/{id}/delete', [FaqController::class, 'destroy'], [AuthMiddleware::class]);

$router->get('/settings/hero', [SettingsController::class, 'hero'], [AuthMiddleware::class]);
$router->post('/settings/hero', [SettingsController::class, 'updateHero'], [AuthMiddleware::class]);

$router->get('/settings/icons', [SettingsController::class, 'icons'], [AuthMiddleware::class]);
$router->post('/settings/icons/accreditations', [SettingsController::class, 'storeAccreditation'], [AuthMiddleware::class]);
$router->post('/settings/icons/accreditations/{code}', [SettingsController::class, 'updateAccreditation'], [AuthMiddleware::class]);
$router->post('/settings/icons/accreditations/{code}/delete', [SettingsController::class, 'destroyAccreditation'], [AuthMiddleware::class]);
$router->post('/settings/icons/quick-facts/{code}', [SettingsController::class, 'updateQuickFactIcon'], [AuthMiddleware::class]);

// Public read-only JSON API — powers the static frontend's content sync.
$router->get('/api/treatments.json', [PublicContentController::class, 'treatmentsList']);
$router->get('/api/specialties.json', [PublicContentController::class, 'specialtiesList']);
$router->get('/api/treatments/{slug}.json', [PublicContentController::class, 'treatmentBySlug']);
$router->get('/api/hospitals.json', [PublicContentController::class, 'hospitalsList']);
$router->get('/api/hospitals/{slug}.json', [PublicContentController::class, 'hospitalBySlug']);
$router->get('/api/doctors.json', [PublicContentController::class, 'doctorsList']);
$router->get('/api/testimonials.json', [PublicContentController::class, 'testimonialsList']);
$router->get('/api/faqs.json', [PublicContentController::class, 'faqsList']);
$router->get('/api/hero.json', [PublicContentController::class, 'hero']);
