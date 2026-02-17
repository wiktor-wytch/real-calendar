# Bump Obsidian Plugin Version

You are updating the version of an Obsidian plugin repository hosted on GitHub.

Follow these rules exactly.

---

## Goal

Increment the plugin version and prepare it for release tagging.

---

## Required Behavior

1. Read the current version from:

   * `manifest.json`
   * `package.json` (if present)

2. Determine the next version using Semantic Versioning:

   * PATCH: X.Y.Z → X.Y.(Z+1) (default)
   * MINOR: X.Y.Z → X.(Y+1).0
   * MAJOR: X.Y.Z → (X+1).0.0

   If no release type is specified, increment PATCH.

3. Update:

   * `"version"` field in `manifest.json`
   * `"version"` field in `package.json` (if it exists)

4. Do NOT:

   * Modify any other fields
   * Reformat the file
   * Change indentation
   * Create a git tag
   * Edit unrelated files

5. Ensure:

   * Versions match exactly between files
   * Version format is strictly `number.number.number`
   * No leading `v`
   * No extra metadata (no `-beta`, etc., unless explicitly requested)

---

## Expected Output

Return:

* Previous version
* New version
* Confirmation both files match
* The exact git commands required next:

```bash
git add manifest.json package.json
git commit -m "Bump version to X.Y.Z"
git push origin main
```

Then provide the tagging command separately:

```bash
git tag -a X.Y.Z -m "X.Y.Z"
git push origin X.Y.Z
```

---

## Safety Constraints

* Never reuse an existing version.
* Never overwrite an existing git tag.
* Never auto-publish a release.
* Only update version fields.

---

If release type is specified (PATCH, MINOR, MAJOR), apply it deterministically.
If ambiguous, default to PATCH.
