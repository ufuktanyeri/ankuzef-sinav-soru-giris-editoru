# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Goal

Automate transferring exam questions and topics ("Soru ve Konu aktarımı") into the Ankara Üniversitesi ANKUZEF exam system at `https://ankuzefsinav.ankara.edu.tr`. Per `.antigravity/ankuzef.rules`, the planned deliverables are:

- **Module_Map** – DOM IDs, selectors, and input types for the site's "Soru Ekle", "Konu Ekle", and "Sınav Listesi" modules.
- **Universal_Template_Schema** – an Excel/JSON input format for questions.
- **Extension_Architecture_Plan** – the planned delivery vehicle is a browser extension.

The site requires **KDS authentication**. Any browser-based analysis must first verify there is an active logged-in session and, if not, ask the user to log in via KDS themselves — never attempt to handle credentials.

## Question data format (`data/*.json`)

Each file is a JSON array of question objects, one file per exam. `konu` maps to a 'Konu' in the target system.

- Files are UTF-8 with Turkish characters and math symbols (`→`, `−`, `∞`); math is plain text (e.g. `sqrt(2)`, `x^2`), not LaTeX. Preserve encoding when reading/writing.
- `soru_grubu` is consistent within a file and matches the filename's exam type.
- The file prefix (`ZAUF1106`) is the course code.
