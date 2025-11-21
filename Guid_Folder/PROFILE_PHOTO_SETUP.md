# Profile Photo Setup Guide

This guide explains how to set up the profile photo feature with Supabase storage integration.

## Features Added

### 🖼️ Profile Photo Upload
- **File Upload**: Support for image files (JPG, PNG, GIF, WebP)
- **File Size Limit**: Maximum 5MB per image
- **Preview**: Real-time preview before saving
- **Storage**: Secure storage in Supabase Storage
- **Display**: Profile photos shown in Settings and Sidebar

### 🎨 Creative UI Design
- **Gradient Backgrounds**: Beautiful gradient overlays
- **Hover Effects**: Interactive hover animations
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Upload progress indicators
- **Error Handling**: User-friendly error messages

## Setup Instructions

### 1. Database Setup

Run the avatar storage SQL file:

```sql
-- Execute this in your Supabase SQL editor
-- File: database/10_avatars_storage.sql

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 2. Supabase Storage Configuration

1. **Enable Storage**: Make sure Storage is enabled in your Supabase project
2. **Bucket Creation**: The SQL above creates the 'avatars' bucket automatically
3. **Public Access**: The bucket is set to public for easy image serving
4. **Security**: RLS policies ensure users can only manage their own avatars

### 3. File Structure

The profile photo feature includes:

```
src/
├── pages/
│   └── Settings.tsx          # Enhanced with photo upload
├── components/
│   └── Sidebar.tsx          # Shows profile photos
├── hooks/
│   └── useSupabase.ts       # Updated with avatar_url support
└── database/
    └── 10_avatars_storage.sql # Storage setup
```

## Usage

### For Users

1. **Upload Photo**:
   - Go to Settings → Profile tab
   - Click the camera icon or "Upload Photo" button
   - Select an image file (max 5MB)
   - Preview appears instantly
   - Click "Save Changes" to upload

2. **Change Photo**:
   - Upload a new photo following the same steps
   - Previous photo is replaced

3. **Remove Photo**:
   - Click "Remove" button when photo is selected
   - Falls back to initials avatar

### For Developers

#### Profile Photo Component Features

```tsx
// Key features implemented:
- File validation (size, type)
- Real-time preview
- Supabase storage upload
- Error handling
- Loading states
- Responsive design
```

#### Storage Structure

```
avatars/
└── {user_id}-{timestamp}.{extension}
    # Example: 123e4567-e89b-12d3-a456-426614174000-1703123456789.jpg
```

## Security Features

### 1. File Validation
- **Size Limit**: 5MB maximum
- **File Type**: Only image files allowed
- **Extension Check**: Validates file extensions

### 2. Storage Security
- **RLS Policies**: Users can only access their own files
- **Path Structure**: User ID embedded in file path
- **Public URLs**: Safe public access for display

### 3. Upload Security
- **Authentication**: Must be logged in to upload
- **User Isolation**: Files stored per user ID
- **Overwrite Protection**: Timestamped filenames

## Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check file size (must be < 5MB)
   - Verify file is an image
   - Ensure user is authenticated
   - Check Supabase storage permissions

2. **Image Not Displaying**
   - Verify bucket is public
   - Check RLS policies are correct
   - Ensure avatar_url is saved in database

3. **Storage Bucket Missing**
   - Run the SQL setup script
   - Check bucket exists in Supabase dashboard
   - Verify bucket permissions

### Debug Steps

1. **Check Console**: Look for JavaScript errors
2. **Network Tab**: Verify upload requests succeed
3. **Supabase Logs**: Check storage and database logs
4. **Database**: Verify avatar_url is saved correctly

## Customization

### Styling
- Modify gradient colors in Settings.tsx
- Adjust hover effects and animations
- Customize upload button appearance

### File Limits
- Change size limit in `handleAvatarSelect`
- Modify allowed file types
- Add additional validation

### Storage
- Change bucket name (update all references)
- Modify file naming convention
- Add image processing/resizing

## Best Practices

1. **Image Optimization**: Consider adding image compression
2. **CDN**: Use Supabase CDN for better performance
3. **Fallbacks**: Always provide initials fallback
4. **Loading States**: Show progress during uploads
5. **Error Handling**: Provide clear error messages

## Future Enhancements

- [ ] Image cropping/editing
- [ ] Multiple photo sizes (thumbnails)
- [ ] Drag & drop upload
- [ ] Bulk photo management
- [ ] Image filters/effects
- [ ] Social media integration