/**
 * Popup giriş noktası. Faz 6'da `PopupWizard` `#app`'e bağlanacak.
 */
export async function bootstrapPopup(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('#app kök öğesi bulunamadı');
  }
  const note = document.createElement('p');
  note.className = 'placeholder';
  note.textContent = 'ANKUZEF Soru Aktarıcı — Faz 2 iskeleti. Sihirbaz Faz 6’da eklenecek.';
  root.replaceChildren(note);
}

void bootstrapPopup();
