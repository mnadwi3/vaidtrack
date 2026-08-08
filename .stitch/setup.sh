#!/bin/bash
# Google Stitch Setup Script for VaidTrack
# This script helps configure Google Stitch integration

set -e

echo "======================================"
echo "  VaidTrack Google Stitch Setup"
echo "======================================"
echo ""

# Check for required commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ Error: $1 is not installed. Please install it and try again."
        exit 1
    fi
}

# Check prerequisites
echo "Checking prerequisites..."
check_command curl
check_command jq
echo "✓ Prerequisites OK"
echo ""

# Create .env file
echo "Setting up environment file..."
if [ ! -f .stitch/.env ]; then
    cp .stitch/.env.example .stitch/.env
    echo "✓ Created .stitch/.env"
    echo "⚠️  IMPORTANT: Edit .stitch/.env with your actual credentials"
else
    echo "✓ .stitch/.env already exists"
fi
echo ""

# Load environment variables
if [ -f .stitch/.env ]; then
    set -a
    source .stitch/.env
    set +a
fi

# Validate GCP credentials
echo "Validating Google Cloud credentials..."
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS not set"
    echo "   Download a service account key from GCP Console and set it"
else
    if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        echo "✓ Service account file found"
    else
        echo "❌ Service account file not found: $GOOGLE_APPLICATION_CREDENTIALS"
    fi
fi
echo ""

# Test BigQuery connection (if credentials available)
if [ ! -z "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "Testing BigQuery connection..."
    if command -v bq &> /dev/null; then
        export GOOGLE_APPLICATION_CREDENTIALS="$GOOGLE_APPLICATION_CREDENTIALS"
        if bq ls --project_id="$GCP_PROJECT_ID" 2>/dev/null; then
            echo "✓ BigQuery connection OK"
        else
            echo "⚠️  Could not connect to BigQuery. Check credentials and project ID."
        fi
    else
        echo "ℹ️  Install gcloud CLI to test BigQuery connection:"
        echo "   https://cloud.google.com/sdk/docs/install"
    fi
else
    echo "ℹ️  Skipping BigQuery test (credentials not configured)"
fi
echo ""

# Create BigQuery dataset
echo "Creating BigQuery dataset..."
if [ ! -z "$GCP_PROJECT_ID" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ] && command -v bq &> /dev/null; then
    export GOOGLE_APPLICATION_CREDENTIALS="$GOOGLE_APPLICATION_CREDENTIALS"
    DATASET_ID="vaidtrack_data"
    if bq ls -d --project_id="$GCP_PROJECT_ID" | grep -q "^$DATASET_ID"; then
        echo "✓ Dataset '$DATASET_ID' already exists"
    else
        bq mk --project_id="$GCP_PROJECT_ID" --dataset "$DATASET_ID"
        echo "✓ Created dataset '$DATASET_ID'"
    fi
else
    echo "ℹ️  Skipping dataset creation (run this manually or configure credentials)"
fi
echo ""

# Create sample tables
echo "Creating sample BigQuery tables..."
cat > /tmp/doctors_schema.json << 'EOF'
[
  {"name": "id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "name", "type": "STRING", "mode": "REQUIRED"},
  {"name": "specialty", "type": "STRING", "mode": "NULLABLE"},
  {"name": "experience_years", "type": "INTEGER", "mode": "NULLABLE"},
  {"name": "hospital", "type": "STRING", "mode": "NULLABLE"},
  {"name": "updated_at", "type": "TIMESTAMP", "mode": "NULLABLE"}
]
EOF

if [ ! -z "$GCP_PROJECT_ID" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ] && command -v bq &> /dev/null; then
    export GOOGLE_APPLICATION_CREDENTIALS="$GOOGLE_APPLICATION_CREDENTIALS"
    if ! bq show "$GCP_PROJECT_ID:vaidtrack_data.doctors" 2>/dev/null; then
        bq mk --project_id="$GCP_PROJECT_ID" --schema=/tmp/doctors_schema.json "vaidtrack_data.doctors"
        echo "✓ Created 'doctors' table"
    else
        echo "✓ Table 'doctors' already exists"
    fi
else
    echo "ℹ️  Skipping table creation (configure credentials to automate)"
fi
rm -f /tmp/doctors_schema.json
echo ""

echo "======================================"
echo "  Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Edit .stitch/.env with your credentials:"
echo "   - GCP_PROJECT_ID: Your Google Cloud project"
echo "   - GOOGLE_APPLICATION_CREDENTIALS: Path to service account key"
echo "   - DOCTORS_API_URL: Your API endpoint (or enable MySQL instead)"
echo ""
echo "2. Create a Stitch account (if not already):"
echo "   - Go to https://www.stitchdata.com"
echo "   - Create a new project"
echo "   - Add sources (REST API, database, etc.)"
echo "   - Configure BigQuery as destination"
echo ""
echo "3. Test the integration:"
echo "   - Check .stitch/config.json for source configuration"
echo "   - Verify BigQuery dataset and tables"
echo "   - Run initial sync from Stitch dashboard"
echo ""
echo "Documentation: .stitch/README.md"
