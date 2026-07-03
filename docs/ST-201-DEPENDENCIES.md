# ST-201 - Supabase Storage Integration - Dependencies and Configuration

## 📦 Required Dependencies

### Core Dependencies

```bash
npm install pdf-parse mammoth xlsx officeparser
```

### Dependency Details

| Package | Version | Purpose | Required |
|---------|---------|---------|----------|
| `pdf-parse` | ^1.1.1 | PDF text extraction | ✅ Yes |
| `mammoth` | ^1.6.0 | DOCX text extraction | ✅ Yes |
| `xlsx` | ^0.18.5 | XLSX text extraction | ✅ Yes |
| `officeparser` | ^4.0.0 | PPTX/DOC/PPT/XLS extraction | ✅ Yes |

## 🔧 Configuration

### Environment Variables

Add to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Storage Configuration
SUPABASE_STORAGE_BUCKET=documents
```

### Supabase Storage Setup

1. **Create the bucket** in Supabase Storage:
   - Name: `documents`
   - Public access: Read-only (or private if needed)

2. **Set up policies** (RLS):
   ```sql
   -- Allow read access to authenticated users
   create policy "Enable read access for authenticated users"
   on storage.objects for select
   using (auth.role() = 'authenticated');

   -- Allow upload/download for service role
   create policy "Enable full access for service role"
   on storage.objects for all
   using (request.remoteAddress() = 'service_role');
   ```

## 🚀 Usage

### CLI Script

```bash
# Dry run (test without saving)
npx ts-node scripts/index-supabase.ts --dry-run --limit=5

# Full indexation
npx ts-node scripts/index-supabase.ts

# With specific options
npx ts-node scripts/index-supabase.ts --prefix=clients/ --client=nexia --type=contract
```

### API Endpoint

```typescript
// POST /api/sources/supabase/sync
const response = await fetch('/api/sources/supabase/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'admin-user-id',
    'x-user-email': 'admin@example.com'
  },
  body: JSON.stringify({
    prefix: 'clients/nexia',
    client: 'nexia',
    documentType: 'contract',
    dryRun: false,
    limit: 10
  })
});
```

## 📋 Supported File Types

### Text Files
- `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`
- `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.c`, `.cpp`
- `.sh`, `.bash`, `.yml`, `.yaml`, `.sql`, `.log`

### PDF Files
- `.pdf` (via pdf-parse)

### Office Files
- `.docx` (via mammoth)
- `.xlsx` (via xlsx)
- `.pptx`, `.doc`, `.ppt`, `.xls` (via officeparser)

### Image Files
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.tiff`, `.webp`, `.svg`
- Requires external OCR service (not implemented)

## 🧪 Testing

### Unit Tests

```bash
npm test src/lib/supabase/storage/
```

### Manual Testing

1. Place test files in Supabase Storage bucket
2. Run CLI script in dry-run mode
3. Verify extraction results
4. Run full indexation

## ⚠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `pdf-parse not found` | Run `npm install pdf-parse` |
| `Cannot connect to Supabase` | Check environment variables |
| `Bucket not found` | Create 'documents' bucket in Supabase |
| `Access denied` | Verify RLS policies and service role key |
| `No files found` | Upload files to the bucket first |

### Debugging

```bash
# Check Supabase connection
test-supabase-connection.js

# Test PDF extraction directly
test-pdf-extraction.js

# Verify bucket contents
list-supabase-files.js
```

## 📚 Documentation

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [pdf-parse API](https://www.npmjs.com/package/pdf-parse)
- [mammoth API](https://www.npmjs.com/package/mammoth)
- [xlsx API](https://www.npmjs.com/package/xlsx)
- [officeparser API](https://www.npmjs.com/package/officeparser)

## 🎯 Next Steps

1. **Test with real files** in Supabase Storage
2. **Configure external OCR** for image processing
3. **Monitor performance** with large files
4. **Proceed to ST-202** (GitLab API Integration)

---

**Status:** ✅ **ST-201 COMPLETE**
**Date:** 2026-07-02
**Version:** 1.0.0