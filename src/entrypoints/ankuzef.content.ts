import { defineContentScript } from 'wxt/utils/define-content-script';

/**
 * ankuzefsinav.ankara.edu.tr üzerinde çalışan content script.
 * Faz 4'te `ANKUZEF_POST` / `ANKUZEF_SESSION` mesajları burada yürütülecek.
 * MAIN world betiği gerekmez: yalnızca localStorage okunur, CKEditor'a dokunulmaz.
 */
export default defineContentScript({
  matches: ['https://ankuzefsinav.ankara.edu.tr/*'],
  main() {
    // Faz 2 iskeleti: henüz mesaj dinleyicisi yok.
  },
});
