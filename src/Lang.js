
const translations = {
  en: {
    "add": "Add",
    "cancel": "Cancel",
    "apply": "Apply",
    "save": "Save",
    "exit": "Exit",
    "reset": "Reset",
    "select_metavariables": "Some metavariables are not unspecified. Please select a value for each metavariable.",
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
    "select_metavariables": "Certaines métavariables ne sont pas spécifiées. Veuillez choisir une valeur pour chaque métavariable.",
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
    "select_metavariables": "Einige metavariablen sind nicht unspezifiziert. Bitte wählen Sie einen Wert für jede metavariable.",
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
    "select_metavariables": "Algunas metavariables no están especificadas. Por favor, seleccione un valor para cada metavariable.",
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
    "select_metavariables": "Alcune metavariabili non sono specificate. Seleziona un valore per ogni metavariabile.",
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
    "select_metavariables": "いくつかのメタ変数が未指定です。メタ変数ごとに値を選択してください。",
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
    "select_metavariables": "일부 메타변수는 선택되지 않았습니다. 메타변수별로 값을 선택하십시오.",
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
    "select_metavariables": "Sommige metavariables zijn niet ongedefinieerd. Selecteer een waarde voor elke metavariable.",
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
    "select_metavariables": "Algumas variáveis meta não foram especificadas. Por favor, selecione um valor para cada variável meta.",
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
    "select_metavariables": "某些元变量未指定。请为每个元变量选择一个值。",
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
    "select_metavariables": "Деякі метаваріалі не визначені. Виберіть значення для кожної метаваріалі.",
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