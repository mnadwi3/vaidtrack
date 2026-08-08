# Google Stitch Integration for VaidTrack

This directory contains the configuration and setup for Google Stitch, a data integration platform that syncs data from various sources (databases, APIs, SaaS tools) to Google BigQuery for analytics and reporting.

## Overview

**Stitch** extracts data from your sources and loads it into BigQuery, enabling:
- **Real-time data syncing** from multiple sources
- **Centralized data warehouse** in Google BigQuery
- **Analytics and dashboards** on unified data
- **Automated data pipelines** on schedules you define

---

## Quick Start

### 1. Prerequisites

- Google Cloud Platform (GCP) account with BigQuery enabled
- Google Stitch account (free tier available at https://www.stitchdata.com)
- gcloud CLI installed (optional, for manual BigQuery operations)
- curl and jq (for testing and scripting)

### 2. Set Up Credentials

```bash
# Copy environment file
cp .stitch/.env.example .stitch/.env

# Edit with your credentials
nano .stitch/.env
```

**Required environment variables:**
- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to GCP service account key JSON
- `STITCH_CLIENT_ID` and `STITCH_TOKEN`: From Stitch dashboard

### 3. Run Setup Script

```bash
cd /home/user/kenyalandingpage
./.stitch/setup.sh
```

This will:
- Validate prerequisites
- Create `.stitch/.env` (if missing)
- Test BigQuery connection
- Create the `vaidtrack_data` dataset
- Create sample tables (doctors, leads)

---

## Configuration Files

### `config.json`

Main Stitch configuration defining:
- **Destination**: Google BigQuery project, dataset
- **Sources**: Data sources (REST API, MySQL, PostgreSQL, etc.)
- **Schedules**: Sync frequency (hourly, daily, etc.)

**Key sections:**

```json
{
  "destination": {
    "type": "google-bigquery",
    "project_id": "your-gcp-project-id",
    "dataset": "vaidtrack_data"
  },
  "sources": [
    {
      "id": "doctors-api",
      "type": "rest-api",
      "config": {
        "base_url": "https://api.yourdomain.com",
        "endpoints": [
          {
            "path": "/api/doctors",
            "destination_table": "doctors"
          }
        ]
      }
    }
  ]
}
```

### `.env` (Credentials)

Store sensitive configuration in `.env`:
```
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
DOCTORS_API_URL=https://api.yourdomain.com
DOCTORS_API_TOKEN=your_token
DB_HOST=localhost
DB_USER=stitch_user
DB_PASSWORD=password
```

**⚠️ IMPORTANT:** Never commit `.env` to git. It's in `.gitignore` by default.

---

## Data Sources

### Option 1: REST API (Recommended for Doctors Data)

If you have an API endpoint that serves doctor data:

```json
{
  "id": "doctors-api",
  "type": "rest-api",
  "config": {
    "base_url": "https://api.yourdomain.com",
    "endpoints": [
      {
        "path": "/api/doctors",
        "method": "GET",
        "destination_table": "doctors",
        "sync_interval_minutes": 60
      }
    ],
    "auth": {
      "type": "bearer",
      "token": "${DOCTORS_API_TOKEN}"
    }
  }
}
```

### Option 2: MySQL Database (For Lead Submissions)

If you store lead form submissions in MySQL:

```json
{
  "id": "leads-database",
  "type": "mysql",
  "config": {
    "host": "${DB_HOST}",
    "port": 3306,
    "database": "${DB_NAME}",
    "username": "${DB_USER}",
    "password": "${DB_PASSWORD}",
    "tables": [
      {
        "name": "leads",
        "destination_table": "lead_submissions",
        "sync_interval_minutes": 30
      }
    ]
  }
}
```

### Option 3: PostgreSQL

Similar to MySQL, replace `"type": "postgres"` and adjust port to 5432.

### Option 4: Google Sheets

For simple data (e.g., doctors list in a spreadsheet):

```json
{
  "id": "doctors-sheet",
  "type": "google-sheets",
  "config": {
    "spreadsheet_id": "your_spreadsheet_id",
    "worksheets": [
      {
        "title": "Doctors",
        "destination_table": "doctors"
      }
    ]
  }
}
```

---

## Destination: Google BigQuery

All synced data goes to **Google BigQuery**, Google's serverless data warehouse.

### Setup BigQuery

1. **Create a GCP Project** (if needed):
   - Go to https://console.cloud.google.com
   - Create a new project

2. **Enable BigQuery API**:
   - In GCP Console, search "BigQuery API"
   - Click "Enable"

3. **Create a Service Account**:
   - Go to IAM & Admin → Service Accounts
   - Create a new service account with name `stitch-bigquery`
   - Grant role: `BigQuery Admin`
   - Create and download JSON key
   - Save to `.stitch/google-service-account-key.json` (example path)

4. **Update `.env`**:
   ```
   GCP_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=/home/user/kenyalandingpage/.stitch/google-service-account-key.json
   ```

5. **Create dataset** (automatic if using setup.sh):
   ```bash
   bq mk --dataset vaidtrack_data
   ```

### BigQuery Dataset Structure

After setup, you'll have:

```
vaidtrack_data (dataset)
├── doctors (table)
│   ├── id (STRING)
│   ├── name (STRING)
│   ├── specialty (STRING)
│   ├── experience_years (INTEGER)
│   ├── hospital (STRING)
│   └── updated_at (TIMESTAMP)
│
├── lead_submissions (table)
│   ├── id (STRING)
│   ├── name (STRING)
│   ├── email (STRING)
│   ├── phone (STRING)
│   ├── treatment_type (STRING)
│   ├── message (STRING)
│   └── created_at (TIMESTAMP)
│
└── _sdc_batches (internal, created by Stitch)
```

---

## Setting Up in Stitch Dashboard

Once Stitch credentials are configured:

1. **Log in** to https://www.stitchdata.com/sign-in

2. **Create or select a project**

3. **Add a source connector**:
   - Click "Create a Source"
   - Choose your source type (REST API, MySQL, etc.)
   - Fill in connection details from `.env`
   - Test connection
   - Select tables/endpoints to sync
   - Configure sync frequency (hourly, daily, etc.)

4. **Configure destination**:
   - Select "Google BigQuery" as destination
   - Paste service account JSON key
   - Specify dataset: `vaidtrack_data`

5. **Start replication**:
   - Review configuration
   - Click "Start Replication"
   - Monitor sync status in Stitch dashboard

---

## Monitoring & Troubleshooting

### Check Sync Status

**In Stitch Dashboard:**
- Go to your project
- Click "Extractions" to see sync history
- View logs for any errors

**In BigQuery:**
```bash
# List tables
bq ls vaidtrack_data

# Check row count
bq query --use_legacy_sql=false 'SELECT COUNT(*) FROM `project.vaidtrack_data.doctors`'

# View schema
bq show vaidtrack_data.doctors
```

### Common Issues

**Authentication failed**
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path
- Check service account has BigQuery Admin role
- Ensure JSON key has correct permissions

**Sync not running**
- Check Stitch dashboard for paused jobs
- Verify source credentials in Stitch
- Check BigQuery dataset exists: `bq ls -d`

**Data not appearing in BigQuery**
- Wait for sync to complete (check Stitch dashboard)
- Verify table schema matches source data
- Check row count: `bq query 'SELECT COUNT(*) FROM vaidtrack_data.doctors'`

**Source connection failed**
- Verify API/database credentials in `.env`
- Test API endpoint: `curl -H "Authorization: Bearer $TOKEN" $API_URL`
- Test database: `mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME`

---

## Advanced Configuration

### Incremental Sync (Only New/Changed Data)

To sync only new or modified records:

```json
{
  "path": "/api/doctors",
  "destination_table": "doctors",
  "sync_type": "incremental",
  "incremental_key": "updated_at",
  "sync_interval_minutes": 30
}
```

Stitch will track the `updated_at` timestamp and only fetch records newer than the last sync.

### Column Mapping

Map source columns to custom BigQuery column names:

```json
{
  "path": "/api/doctors",
  "destination_table": "doctors",
  "column_mapping": {
    "doctor_id": "id",
    "full_name": "name",
    "specialization": "specialty"
  }
}
```

### Data Transformation

For complex transformations (renaming, filtering, aggregations), use **BigQuery SQL** or **dbt**:

```bash
# Example: Create a cleaned/deduped table
bq query --use_legacy_sql=false '
CREATE OR REPLACE TABLE vaidtrack_data.doctors_cleaned AS
SELECT
  * EXCEPT(row_num)
FROM (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) as row_num
  FROM vaidtrack_data.doctors
)
WHERE row_num = 1
'
```

---

## Analytics & Reporting

Once data is in BigQuery, you can:

1. **Query with BigQuery UI**:
   - https://console.cloud.google.com/bigquery

2. **Connect visualization tools**:
   - Google Looker Studio (free)
   - Tableau
   - Data Studio

3. **Integrate with Google Analytics**:
   - Link GA4 to BigQuery
   - Combine with Stitch data for comprehensive analytics

---

## Cost Considerations

- **Stitch**: Free tier available; paid plans start ~$100/month
- **BigQuery**: Free tier (1TB/month query); storage is cheap (~$0.02/GB)
- **Data transfer**: Free between Stitch and BigQuery

---

## Next Steps

1. ✅ Credentials configured (`.env`)
2. ✅ BigQuery dataset created
3. **TODO**: Add your actual data source (API, database, etc.)
4. **TODO**: Log in to Stitch and create extractors
5. **TODO**: Verify data in BigQuery
6. **TODO**: Set up dashboards/reports

---

## Support & Resources

- **Stitch Docs**: https://www.stitchdata.com/docs
- **BigQuery Docs**: https://cloud.google.com/bigquery/docs
- **Google Stitch Connectors**: https://www.stitchdata.com/integrations
- **Community**: https://stitch-community.slack.com

---

## File Structure

```
.stitch/
├── README.md                      # This file
├── config.json                    # Main Stitch configuration
├── .env.example                   # Environment variables template
├── .env                           # (created by setup.sh, not in git)
├── setup.sh                       # Setup automation script
├── google-service-account-key.json # (optional, download from GCP)
└── logs/                          # (optional, sync logs)
```

---

**Last updated**: 2026-08-08
