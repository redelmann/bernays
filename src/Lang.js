
const translations = {
  en: {
    "add": "Add",
    "cancel": "Cancel",
    "apply": "Apply",
    "save": "Save",
    "exit": "Exit",
    "reset": "Reset",
    "choose_replacements": "Select replacements",
    "new_goal": "New goal",
  },
  fr: {
    "add": "Ajouter",
    "cancel": "Annuler",
    "apply": "Appliquer",
    "save": "Sauvegarder",
    "exit": "Quitter",
    "reset": "Réinitialiser",
    "choose_replacements": "Sélectionner les remplacements",
    "new_goal": "Nouveau but",
  },
  de: {
    "add": "Hinzufügen",
    "cancel": "Abbrechen",
    "apply": "Anwenden",
    "save": "Speichern",
    "exit": "Beenden",
    "reset": "Zurücksetzen",
    "choose_replacements": "Wählen Sie Ersatzvariablen",
    "new_goal": "Neues Ziel",
  },
  es: {
    "add": "Añadir",
    "cancel": "Cancelar",
    "apply": "Aplicar",
    "save": "Guardar",
    "exit": "Salir",
    "reset": "Reiniciar",
    "choose_replacements": "Seleccione sustituciones",
    "new_goal": "Nuevo objetivo",
  },
  it: {
    "add": "Aggiungi",
    "cancel": "Annulla",
    "apply": "Applica",
    "save": "Salva",
    "exit": "Esci",
    "reset": "Reimposta",
    "choose_replacements": "Scegli sostituzioni",
    "new_goal": "Nuovo obiettivo",
  },
  ja: {
    "add": "追加",
    "cancel": "キャンセル",
    "apply": "適用",
    "save": "保存",
    "exit": "終了",
    "reset": "リセット",
    "choose_replacements": "置換を選択",
    "new_goal": "新しい目標",
  },
  ko: {
    "add": "추가",
    "cancel": "취소",
    "apply": "적용",
    "save": "저장",
    "exit": "종료",
    "reset": "재설정",
    "choose_replacements": "대체 변수 선택",
    "new_goal": "새로운 목표",
  },
  nl: {
    "add": "Toevoegen",
    "cancel": "Annuleren",
    "apply": "Toepassen",
    "save": "Opslaan",
    "exit": "Afsluiten",
    "reset": "Reset",
    "choose_replacements": "Kies vervangingen",
    "new_goal": "Nieuw doel",
  },
  pt: {
    "add": "Adicionar",
    "cancel": "Cancelar",
    "apply": "Aplicar",
    "save": "Salvar",
    "exit": "Sair",
    "reset": "Resetar",
    "choose_replacements": "Escolha substituições",
    "new_goal": "Novo objetivo",
  },
  zh: {
    "add": "添加",
    "cancel": "取消",
    "apply": "应用",
    "save": "保存",
    "exit": "退出",
    "reset": "重置",
    "choose_replacements": "选择替换",
    "new_goal": "新目标",
  },
  uk: {
    "add": "Додати",
    "cancel": "Скасувати",
    "apply": "Застосувати",
    "save": "Зберегти",
    "exit": "Вийти",
    "reset": "Скинути",
    "choose_replacements": "Виберіть заміни",
    "new_goal": "Нова мета",
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