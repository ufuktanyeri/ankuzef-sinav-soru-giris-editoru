/**
 * Ön izleme giriş noktası. Faz 6'da `PreviewRenderer` + `runRulesCheck` buraya bağlanacak.
 */
export async function bootstrapPreview(): Promise<void> {
  const root = document.getElementById('sorular');
  if (!root) {
    throw new Error('#sorular kök öğesi bulunamadı');
  }
  const note = document.createElement('p');
  note.className = 'placeholder';
  note.textContent = 'Ön izleme Faz 6’da veri güdümlü hâle gelecek.';
  root.replaceChildren(note);
}

void bootstrapPreview();
