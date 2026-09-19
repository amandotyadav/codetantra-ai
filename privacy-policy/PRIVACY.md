# Privacy Policy — CodeTantra AI

**Last updated:** September 19, 2026

This privacy policy describes what data the CodeTantra AI Chrome extension
("the extension") collects, processes, and shares.

## Who this policy covers

This extension is developed and maintained by Aman Yadav
(amandotyadav@gmail.com, [github.com/amandotyadav](https://github.com/amandotyadav)).
This document applies only to the CodeTantra AI extension itself, not to
any website you visit while it is installed.

## What the extension does

CodeTantra AI adds a panel to CodeTantra (`*.codetantra.com`) exercise
pages. When you click "Generate Code", it reads the current question, the
sample test cases, the course name, and the code in your editor, and sends
that information directly from your browser to the AI provider you chose
in the extension's settings — either Google's Generative Language API
(Gemini) or OpenAI's API — to request a suggested solution.

## Data we collect

**We (the extension developer) do not collect, receive, or store any of
your data on any server.** The extension has no backend, no analytics, and
no telemetry.

## Data processed locally

- **API key(s)**: your Gemini and/or OpenAI API key is stored only in your
  browser via `chrome.storage.local`. Each key never leaves your device
  except as part of a request you initiate to that provider's own API.
- **Selected provider**: which provider (Gemini or OpenAI) you last chose
  is also stored in `chrome.storage.local`.
- **Panel position**: the draggable panel's on-screen position is saved to
  the CodeTantra page's `localStorage` so it doesn't reset every time you
  reload the page. This never leaves your browser.

## Data sent to third parties

When you click "Generate Code", the following is sent directly from your
browser to whichever AI provider you selected in the extension's settings —
either **Google's Generative Language API** (`generativelanguage.googleapis.com`)
or **OpenAI's API** (`api.openai.com`) — authenticated with your own API key
for that provider:

- The text of the current question
- Sample test cases shown on the page
- The course name
- The code currently in your editor (across all open files)

This data is sent solely to generate a response for you. It is not sent to,
processed by, or stored by any server operated by the developer of this
extension. The provider's handling of this data is governed by its own
terms, not by this policy:
[Google's Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms)
and [Google's Privacy Policy](https://policies.google.com/privacy), or
[OpenAI's Terms of Use](https://openai.com/policies/terms-of-use) and
[OpenAI's Privacy Policy](https://openai.com/policies/privacy-policy).

## What we don't do

- We don't use analytics or tracking libraries.
- We don't sell or share your data with advertisers.
- We don't collect browsing history outside CodeTantra pages — the
  extension only runs on `*.codetantra.com`.
- We don't store your API key, questions, code, or generated solutions on
  any server we operate.

## Your choices

- You can remove your API key(s) at any time from the extension's options
  page, which deletes them from `chrome.storage.local`.
- Uninstalling the extension removes all locally stored data
  (`chrome.storage.local` contents), including your API key(s).
- You control your own API keys and can revoke or regenerate them at any
  time from [Google AI Studio](https://aistudio.google.com/app/apikey)
  (Gemini) or the [OpenAI dashboard](https://platform.openai.com/api-keys).

## Children's privacy

This extension is not directed at children and does not knowingly collect
data from children.

## Changes to this policy

If this policy changes, the "Last updated" date above will be revised, and
material changes will be noted in the project's release history on GitHub.

## Contact

Questions about this policy or the extension's data practices can be sent
to amandotyadav@gmail.com, or opened as an issue on the
[GitHub repository](https://github.com/amandotyadav/codetantra-ai).

---

This policy is hosted at
[github.com/amandotyadav/codetantra-ai/blob/main/privacy-policy/PRIVACY.md](https://github.com/amandotyadav/codetantra-ai/blob/main/privacy-policy/PRIVACY.md).
