
const translations = {
  en: {
    "add": "Add",
    "cancel": "Cancel",
    "apply": "Apply",
    "save": "Save",
    "exit": "Exit",
    "reset": "Reset",
  },
  fr: {
    "add": "Ajouter",
    "cancel": "Annuler",
    "apply": "Appliquer",
    "save": "Sauvegarder",
    "exit": "Quitter",
    "reset": "Réinitialiser",
  },
  de: {
    "add": "Hinzufügen",
    "cancel": "Abbrechen",
    "apply": "Anwenden",
    "save": "Speichern",
    "exit": "Beenden",
    "reset": "Zurücksetzen",
  },
  es: {
    "add": "Añadir",
    "cancel": "Cancelar",
    "apply": "Aplicar",
    "save": "Guardar",
    "exit": "Salir",
    "reset": "Reiniciar",
  },
  it: {
    "add": "Aggiungi",
    "cancel": "Annulla",
    "apply": "Applica",
    "save": "Salva",
    "exit": "Esci",
    "reset": "Reimposta",
  },
  ja: {
    "add": "追加",
    "cancel": "キャンセル",
    "apply": "適用",
    "save": "保存",
    "exit": "終了",
    "reset": "リセット",
  },
  ko: {
    "add": "추가",
    "cancel": "취소",
    "apply": "적용",
    "save": "저장",
    "exit": "종료",
    "reset": "재설정",
  },
  nl: {
    "add": "Toevoegen",
    "cancel": "Annuleren",
    "apply": "Toepassen",
    "save": "Opslaan",
    "exit": "Afsluiten",
    "reset": "Reset",
  },
  pt: {
    "add": "Adicionar",
    "cancel": "Cancelar",
    "apply": "Aplicar",
    "save": "Salvar",
    "exit": "Sair",
    "reset": "Resetar",
  },
  zh: {
    "add": "添加",
    "cancel": "取消",
    "apply": "应用",
    "save": "保存",
    "exit": "退出",
    "reset": "重置",
  },
  uk: {
    "add": "Додати",
    "cancel": "Скасувати",
    "apply": "Застосувати",
    "save": "Зберегти",
    "exit": "Вийти",
    "reset": "Скинути",
  },
};

export function _(key, lang) {
  var selected_lang = lang || window.navigator.userLanguage || window.navigator.language || "en";
  const lang_only = selected_lang.split("-")[0];
  if (lang_only in translations) {
    if (key in translations[lang_only]) {
      return translations[lang_only][key];
    }
  }
  if (key in translations["en"]) {
    return translations["en"][key];
  }
  return key;
}