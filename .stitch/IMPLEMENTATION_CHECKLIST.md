# Google Stitch Implementation Checklist

Complete this checklist to fully set up Google Stitch integration for VaidTrack.

## Phase 1: Prerequisites & Credentials ✓

- [ ] Create Google Cloud Platform account
  - Link: https://console.cloud.google.com
  
- [ ] Create a new GCP project (or use existing)
  - Project ID: `___________________`
  
- [ ] Enable BigQuery API in GCP Console
  - Search "BigQuery API"
  - Click "Enable"
  
- [ ] Create GCP Service Account for BigQuery
  - Go to IAM & Admin → Service Accounts
  - Name: `stitch-bigquery`
  - Grant role: `BigQuery Admin`
  - Create JSON key
  - Download key file
  
- [ ] Create Google Stitch account
  - Link: https://www.stitchdata.com/sign-in
  - Verify email
  - Create organization
  
- [ ] Get Stitch API credentials
  - Go to Stitch Account Settings
  - Find API token
  - Copy Client ID and Token

---

## Phase 2: Local Setup ✓

- [ ] Copy `.env` template
  ```bash
  cp .stitch/.env.example .stitch/.env
  ```
  
- [ ] Add credentials to `.stitch/.env`
  ```
  GCP_PROJECT_ID=your-gcp-project-id
  GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json
  STITCH_CLIENT_ID=your_client_id
  STITCH_TOKEN=your_api_token
  ```
  
- [ ] Place GCP service account key file
  ```bash
  # Option 1: Full path (recommended)
  /path/to/your/google-service-account-key.json
  
  # Option 2: In .stitch directory
  .stitch/google-service-account-key.json
  ```
  
- [ ] Run setup script
  ```bash
  ./.stitch/setup.sh
  ```
  
- [ ] Verify BigQuery dataset created
  ```bash
  bq ls -d --project_id=$GCP_PROJECT_ID
  ```
  Should show: `vaidtrack_data`

---

## Phase 3: Data Source Setup

### Option A: REST API (for Doctors Data)

- [ ] Identify your doctors API endpoint
  - URL: `___________________`
  - Auth type: (bearer/api-key/basic)
  - Token/Key: `___________________`
  
- [ ] Update `.stitch/config.json`
  - Change `base_url` to your API
  - Update `auth` credentials
  - Set `sync_interval_minutes`
  
- [ ] Test API endpoint
  ```bash
  curl -H "Authorization: Bearer $TOKEN" $API_URL/api/doctors | jq
  ```
  
- [ ] Add credentials to `.env`
  ```
  DOCTORS_API_URL=your_api_url
  DOCTORS_API_TOKEN=your_api_token
  ```

### Option B: Database (for Lead Submissions)

- [ ] Set up PostgreSQL or MySQL
  - Hostname: `___________________`
  - Database: `___________________`
  - Username: `___________________`
  - Password: `___________________`
  
- [ ] Create tables (use `init.sql` as reference)
  ```bash
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME < .stitch/init.sql
  ```
  
- [ ] Verify tables created
  ```bash
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"
  ```
  
- [ ] Update `.stitch/config.json`
  - Change database host, port, username
  - Update table names if different
  
- [ ] Test database connection
  ```bash
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM leads;"
  ```
  
- [ ] Add credentials to `.env`
  ```
  DB_HOST=your_hostname
  DB_NAME=your_database
  DB_USER=your_username
  DB_PASSWORD=your_password
  ```

---

## Phase 4: Google Stitch Dashboard Setup

- [ ] Log in to Stitch
  - Link: https://app.stitchdata.com
  
- [ ] Create new project
  - Name: `VaidTrack Data Pipeline`
  - Description: (optional)
  
- [ ] Add BigQuery destination
  - Click "Add Destination"
  - Choose "Google BigQuery"
  - Paste service account JSON key
  - Project ID: `$GCP_PROJECT_ID`
  - Dataset: `vaidtrack_data`
  - Click "Test Connection" → should pass ✓
  - Save destination

### Add Source: REST API (Doctors)

- [ ] Click "Add Source"
  - Type: REST API (or "Generic REST API")
  - Display name: "Doctors Data"
  - Base URL: `$DOCTORS_API_URL`
  - Auth: Bearer token
  - Token: `$DOCTORS_API_TOKEN`
  
- [ ] Test connection → should pass ✓

- [ ] Configure endpoints
  - Endpoint path: `/api/doctors`
  - Destination table: `doctors`
  - Incremental column: `updated_at`
  - Sync frequency: Hourly (or as needed)
  - Column mapping: (if needed)
  
- [ ] Select columns
  - id
  - name
  - specialty
  - experience_years
  - hospital
  - updated_at
  
- [ ] Save source

### Add Source: Database (Leads) - Optional

- [ ] Click "Add Source"
  - Type: PostgreSQL (or MySQL)
  - Display name: "Lead Submissions"
  - Hostname: `$DB_HOST`
  - Port: 5432 (or 3306)
  - Database: `$DB_NAME`
  - Username: `$DB_USER`
  - Password: `$DB_PASSWORD`
  
- [ ] Test connection → should pass ✓

- [ ] Select tables
  - [ ] leads
    - Destination table: `lead_submissions`
    - Incremental column: `updated_at`
    - Sync frequency: Every 30 minutes
  
- [ ] Save source

---

## Phase 5: First Sync & Verification

- [ ] In Stitch Dashboard, click "Start Replication"
  - For each source, begin initial sync
  
- [ ] Monitor sync progress
  - Check "Extractions" tab
  - Wait for "Extraction succeeded"
  - Should take 5-15 minutes for initial sync
  
- [ ] Verify data in BigQuery
  ```bash
  # List tables
  bq ls vaidtrack_data
  
  # Check doctors table
  bq query --use_legacy_sql=false '
    SELECT COUNT(*) as doctor_count FROM `$GCP_PROJECT_ID.vaidtrack_data.doctors`
  '
  
  # Check leads table (if applicable)
  bq query --use_legacy_sql=false '
    SELECT COUNT(*) as lead_count FROM `$GCP_PROJECT_ID.vaidtrack_data.lead_submissions`
  '
  ```
  
- [ ] Sample data query
  ```bash
  bq query --use_legacy_sql=false '
    SELECT * FROM `$GCP_PROJECT_ID.vaidtrack_data.doctors` LIMIT 5
  '
  ```

---

## Phase 6: Ongoing Monitoring

- [ ] Set up sync alerts (in Stitch Dashboard)
  - Go to Account Settings → Notifications
  - Email notifications for sync failures
  
- [ ] Monitor BigQuery costs
  - Go to GCP Console → Billing
  - Set up budgets/alerts
  
- [ ] Review sync logs regularly
  - Stitch Dashboard → Extractions
  - Check for errors or warnings
  
- [ ] Verify data freshness
  - Run periodic queries
  - Monitor `updated_at` timestamps

---

## Phase 7: Reporting & Analysis

- [ ] Connect reporting tool (optional)
  - Google Looker Studio (free)
  - Create dashboards from BigQuery data
  
- [ ] Set up analytics queries
  - Doctor count and specialties
  - Lead volume trends
  - Treatment type distribution
  
- [ ] Integrate with existing tools
  - Link GA4 to BigQuery
  - Combine with Stitch data

---

## Phase 8: Production Deployment

- [ ] Review and test all configurations
  - Verify `.env` has all credentials
  - Test all data sources
  - Confirm BigQuery tables and schemas
  
- [ ] Enable automated syncs
  - In Stitch: Set all sources to "enabled"
  - Monitor first week of automatic syncs
  
- [ ] Document for team
  - Who has access to Stitch?
  - Who manages credentials?
  - How to handle sync failures?
  
- [ ] Set up backup/recovery plan
  - BigQuery backup schedule
  - Data retention policy
  
- [ ] Final sign-off
  - Team review complete?
  - All tests passing?
  - Ready for production?

---

## Troubleshooting Reference

### "Connection refused"
- Verify database is running and accessible
- Check firewall rules
- Verify hostname/IP is correct

### "Authentication failed"
- Verify API token/password is correct
- Check token expiration date
- Verify service account has BigQuery Admin role

### "Sync not running"
- Check Stitch Dashboard for paused jobs
- Verify source and destination connections
- Check BigQuery dataset exists

### "No data in BigQuery"
- Wait for initial sync to complete
- Check Stitch Extractions for errors
- Verify table schemas match expected data

### "BigQuery quota exceeded"
- Check daily query limits
- Review recent queries
- Adjust sync frequency if needed

---

## Useful Links

| Resource | Link |
|----------|------|
| Stitch Docs | https://www.stitchdata.com/docs |
| Stitch Connectors | https://www.stitchdata.com/integrations |
| BigQuery Docs | https://cloud.google.com/bigquery/docs |
| GCP Console | https://console.cloud.google.com |
| Stitch Dashboard | https://app.stitchdata.com |

---

## Notes & Custom Info

Use this section to record project-specific information:

```
GCP Project ID: ___________________
Stitch Project ID: ___________________
BigQuery Dataset: vaidtrack_data
Service Account Email: ___________________
Database Hostname: ___________________
Doctors API URL: ___________________

Team Members:
- ___________________
- ___________________
- ___________________
```

---

**Last Updated**: 2026-08-08  
**Status**: Not Started
