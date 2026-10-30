# International Terminological Guidelines for Higher Education Examination Types

In international higher education literature and data exchange frameworks (e.g., the Bologna Process, ECTS Users’ Guide, or US higher education data registries like PESC and IPEDS), there is no single global taxonomy or ISO code that maps directly to the highly specific administrative and statutory examination categories utilized in the Turkish higher education system.

Global student information systems (SIS) and academic taxonomies categorize examinations based on their **pedagogical timeline**, **assessment methodology (formative vs. summative)**, and **academic calendar placement**, rather than their administrative or legal justifications.

To ensure that your software architecture (`index.html`, `questions.json`, or relational database models) aligns with international enterprise standards, you can map the native Turkish examination frameworks to globally recognized definitions as outlined below.

## 1. Global Terminological Correspondences

### 1. Ara Sınav $\rightarrow$ **Midterm Examination / Progress Exam**

- **Pedagogical Classification:** Evaluated under the scope of continuous or in-course assessment (**Formative / Continuous Assessment**). While **Midterm Examination** is the standard term globally, European frameworks frequently utilize **In-course Assessment** or **Progress Examination** to denote evaluative milestones during an active term.

### 2. Mazeret Sınavı $\rightarrow$ **Make-up Examination / Deferred Exam**

- **Pedagogical Classification:** Standardized in global administrative systems to denote an evaluation administered outside the standard schedule due to verified extenuating circumstances (e.g., medical leave or force majeure). **Make-up Exam** is the universal colloquial equivalent, whereas **Deferred Examination** is the formal operational term utilized within official academic transcripts and SIS data fields.

### 3. Final / Dönem Sonu Sınavı $\rightarrow$ **Final Examination / Summative Assessment**

- **Pedagogical Classification:** The definitive metric for end-of-term academic performance measurement (**Summative Assessment**). It is internationally standardized as either **Final Examination** or **End-of-Term Examination**.

### 4. Bütünleme Sınavı $\rightarrow$ **Resit Examination / Re-examination**

- **Pedagogical Classification:** Extensively standardized across the UK, European Higher Education Area (EHEA / Bologna Process), and Australia, the structured retaking of a failed summative evaluation is formally designated as a **Resit Examination** or **Resit**. While a systemic equivalent is less common in North American higher education, data schemas track this under generic **Re-examination** attributes.

### 5. Üç Ders Sınavı $\rightarrow$ **Graduation Deficit Exam / Senior Resit**

- **Pedagogical Classification:** This category represents a specific institutional mechanism designed for terminal-year students who have a minor credit deficit preventing graduation. It lacks a generic Western systemic equivalent. In international enterprise schemas, it is conventionally logged under descriptive extensions such as **Special Examination for Graduation Deficit** or **Senior Resit Exam**.

### 6. Azami Süre Sonu Sınavı $\rightarrow$ **Statutory Extension Exam / Maximum Residency Re-evaluation**

- **Pedagogical Classification:** In international institutions, issues regarding students exceeding their maximum residency timeframes are typically resolved via academic board reviews or non-examination administrative extensions. Where quantitative evaluations are legally mandated, database schemas categorize them as a **Statutory Extension Examination** or a **Maximum Duration Re-evaluation**.

## 2. Recommended Database, Code, and Schema Architecture

To achieve clean decoupling between the user interface (localized for Turkish institutional environments) and backend data structures, the database should utilize standard enumerated types (**Enums**). This architectural pattern aligns with the **PESC (Postsecondary Electronic Standards Council)** data exchange standards.

### Proposed `questions.json` Schema Integration:

JSON

```
{
  "exam_type": "MIDTERM",
  "konu": "Matrices, Determinants and Linear Equation Systems",
  "soru_grubu": "Final_Pool_A"
}
```

### Enumerated Type (Enum) Mapping Standards Table

When persisting client-side user selections from a localized UI to a relational or non-relational database structure, utilize the following standardized Enum key definitions and English translation values:

| **Localized UI Option (TR)** | **International Standard Key (Enum)** | **Enterprise English Equivalent** |
| ---------------------------- | ------------------------------------- | --------------------------------- |
| **Ara Sınav**                | `MIDTERM` / `PROGRESS`                | Midterm Examination               |
| **Mazeret Sınavı**           | `MAKEUP` / `DEFERRED`                 | Make-up Examination               |
| **Final Sınavı**             | `FINAL` / `SUMMATIVE`                 | Final Examination                 |
| **Bütünleme Sınavı**         | `RESIT` / `REEXAM`                    | Resit Examination                 |
| **Üç Ders Sınavı**           | `GRADUATION_DEFICIT`                  | Special Graduation Exam           |
| **Azami Süre Sonu Sınavı**   | `MAX_DURATION_EXT`                    | Statutory Extension Exam          |

### Implementation Benefits

Implementing this backend abstraction layer yields several long-term development advantages:

- **Interoperability:** Your application's database structure becomes fully compatible with international academic web APIs, microservices, and standardized Learning Management Systems (LMS) such as Canvas or Moodle.
- **Localization Readiness:** Future integration of multilingual UI layers (e.g., adding an English option to your `index.html`) can be executed seamlessly without restructuring existing database objects.
- **Compliance Reporting:** Automates data transformation pipelines required for institutional Bologna Process compatibility tracking and international accreditation self-study reports.