# CivicKey Launch Checklist

## Phase 1: Finish Current Uploads (Today)

### Google Play Console
- [ ] Finish Data Safety section (select "No data collected")
- [ ] Finish Government Apps section (select "No")
- [ ] Set category to "Tools"
- [ ] Add short & full description
- [ ] Upload AAB to Internal Testing track
- [ ] Add yourself as internal tester (your Gmail)
- [ ] Start internal testing rollout

### Apple TestFlight
- [ ] Check email - build should be processed
- [ ] Add yourself as internal tester in App Store Connect
- [ ] Download TestFlight app on iPhone
- [ ] Install and test CivicKey

---

## Phase 2: Test the App (1-2 days)

- [ ] Test on iPhone via TestFlight
- [ ] Test on Android via Internal Testing
- [ ] Verify all screens work
- [ ] Test both English and French
- [ ] Test push notification reminders
- [ ] Check that Maplewood demo municipality loads
- [ ] Check that Saint-Lazare data loads

---

## Phase 3: App Icon & Branding (Before Public Release)

- [ ] Design CivicKey app icon (1024x1024)
- [ ] Replace `assets/icon.png`
- [ ] Replace `assets/adaptive-icon.png`
- [ ] Replace `assets/splash-icon.png`
- [ ] Rebuild both platforms with new icon

---

## Phase 4: Store Screenshots (Before Public Release)

### iOS Screenshots Needed
- [ ] 6.7" display (iPhone 15 Pro Max) - Required
- [ ] 6.5" display (iPhone 14 Plus) - Optional
- [ ] iPad Pro 12.9" - If supporting tablet

### Android Screenshots Needed
- [ ] Phone screenshots (1080x1920 or similar)
- [ ] Tablet - Optional

### Screens to Capture
1. Home screen with upcoming collections
2. Schedule screen with collection cards
3. What Goes Where search
4. Events list
5. Settings (showing language/theme options)

---

## Phase 5: Store Listings (Before Public Release)

### iOS App Store Connect
- [ ] App name & subtitle
- [ ] Description
- [ ] Keywords
- [ ] Screenshots
- [ ] Privacy Policy URL (civickey.ca/privacy)
- [ ] Support URL
- [ ] Category (Utilities)

### Google Play Console
- [ ] Short description (done)
- [ ] Full description (done)
- [ ] Screenshots
- [ ] Feature graphic (1024x500)
- [ ] Privacy Policy URL
- [ ] Category & tags (done)

---

## Phase 6: Public Release

### iOS
- [ ] Submit for App Store Review
- [ ] Wait 1-3 days for approval
- [ ] Release to App Store

### Android
- [ ] Promote from Internal → Production track
- [ ] Submit for review
- [ ] Release to Play Store

---

## Current Status

| Platform | Build | Upload | Testing | Public |
|----------|-------|--------|---------|--------|
| iOS      | ✅    | ✅     | ⏳      | ❌     |
| Android  | ✅    | ⏳     | ❌      | ❌     |

---

## Quick Commands

```bash
# Rebuild after icon changes
eas build --platform all --profile production

# Submit iOS
eas submit --platform ios --latest

# Check build status
eas build:list
```
