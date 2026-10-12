# PIXELFIX AI

**See the Error. Understand the Cause. Fix It.**

PIXELFIX AI is a small evidence-based debugging assistant. It sends screenshots, uploaded source files, or pasted code/error text to the explicitly configured Gemma model through the official Google Gen AI JavaScript SDK, reports supplied evidence separately from inferred causes, and compares a before/after pair. If the API key is absent or a request fails, the local Offline Rescue matcher can still troubleshoot pasted text for common errors.

## Requirements

- Node.js 20 or later
- A Gemini API key, only if you want to try the hosted model request

## Run locally

```sh
npm install
copy .env.example .env
npm start
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). On macOS/Linux, use `cp .env.example .env` instead of `copy`.

Set `GEMINI_API_KEY` in `.env` to enable screenshot, source-file, pasted-text, and comparison requests. `GEMMA_MODEL` defaults to `models/gemma-4-26b-a4b-it`; change it to `models/gemma-4-31b-it` if that model is available and preferred for your API project. `SOURCE_FILE_MAX_BYTES` configures the maximum source/pasted-text size in bytes (default 1048576; maximum 10485760). Restart the server after editing `.env`. The API key is read only by the server; it is never sent to the browser. Do not commit `.env`.

## Important model availability note

This project does **not** silently substitute a Gemini model. Google’s Gemma documentation describes Gemma 4 vision/OCR capabilities, and the current Gemini API documentation recommends the official `@google/genai` SDK. The configured Gemini API key listed both `models/gemma-4-26b-a4b-it` and `models/gemma-4-31b-it` as supporting `generateContent`; `models/gemma-4-26b-a4b-it` was selected and a real screenshot-analysis request succeeded.

PIXELFIX sends only the selected model ID directly to the Gemini API and surfaces API/model errors. API access can still experience intermittent service failures; these are shown as retryable errors, not successful reports.

Google documentation checked:

- [Gemma 4 model overview](https://ai.google.dev/gemma/docs/core)
- [Gemma vision capabilities](https://ai.google.dev/gemma/docs/capabilities/vision)
- [Gemini API model catalog](https://ai.google.dev/gemini-api/docs/models)
- [Google Gen AI SDKs](https://ai.google.dev/gemini-api/docs/libraries)
- [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)

## Demo flow

1. Choose **Try sample error**. The bundled image is sample data; it contains no precomputed analysis.
2. Choose **Analyze evidence**. This requires a reachable model and valid API key.
3. Review the observed evidence, inferred root cause, confidence rationale, suggested fix, and checkable fix-it list.
4. In **Before vs. after**, compare screenshots, pasted code, errors, terminal output, or test results. Each side needs at least one screenshot or non-empty text input; either or both are accepted. Text inputs are limited to 20,000 characters each. The report has one of three statuses: `RESOLVED`, `STILL PRESENT`, or `UNABLE TO VERIFY`.
5. Try pasting `ModuleNotFoundError: No module named 'requests'` into Offline Rescue. It runs locally without the model API.

In **Start with the evidence**, choose one input method: upload a PNG/JPG screenshot (8 MB limit), upload one source file, or paste source/error text. Source uploads accept `.py`, `.java`, `.c`, `.h`, `.cpp`, `.cc`, `.cxx`, `.hpp`, `.js`, `.jsx`, `.ts`, `.tsx`, `.html`, `.css`, `.sql`, `.json`, `.xml`, `.sh`, `.ps1`, `.txt`, and `.log`. Source files and pasted text default to a 1 MiB limit. Uploaded files must be non-empty UTF-8 text; binary files are rejected. The selected language is inferred from a source file's extension, or can be optionally selected for pasted text.

The comparison evaluates only the screenshots and/or text evidence you supply. It cannot certify that the entire program works; run the application and its tests after applying a suggested change.

## Security and limitations

- PNG and JPEG images are validated by MIME type and file signature, limited to 8 MB each, held in memory for the request, and not written to disk.
- Source files are checked against the extension allowlist, size limit, UTF-8 validity, and binary/control-character checks. They are held in memory for analysis and never executed or written to disk.
- The server sends selected evidence to the configured model only after the user starts analysis or comparison. Do not upload secrets or sensitive screenshots/source files.
- Uploaded code is never run. AI-generated shell commands are never executed. Fix-it steps are user-controlled suggestions.
- The offline matcher only handles pasted error text and a small set of common errors; it is not multimodal AI.
- AI output may be incomplete or incorrect. Verify code changes and run appropriate tests.

## Development

```sh
npm run dev
```
