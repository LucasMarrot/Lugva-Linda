// Types partagés pour le système de notifications push de Lugva Linda

export type NotificationPayloadType =
  | 'SESSION_REMINDER' // Apprenant : rappel de séance quotidienne par langue
  | 'WORD_COMPLETED' //   Apprenant : un contributeur a complété un mot soumis
  | 'WORD_ASSIGNED'; //   Contributeur : un apprenant lui soumet un mot à compléter

export type SessionReminderPayload = {
  type: 'SESSION_REMINDER';
  languageId: string;
  languageName: string;
  exerciseCount: number;
};

export type WordCompletedPayload = {
  type: 'WORD_COMPLETED';
  wordId: string;
  wordTerm: string;
  contributorName: string;
};

export type WordAssignedPayload = {
  type: 'WORD_ASSIGNED';
  wordId: string;
  wordTranslation: string;
  languageName: string;
  learnerName: string;
};

export type NotificationPayload =
  | SessionReminderPayload
  | WordCompletedPayload
  | WordAssignedPayload;

export type SerializedPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
};

export type NotificationPreferences = {
  // Apprenants
  sessionReminderEnabled: boolean;
  sessionReminderLanguages: string[]; // IDs de langues — vide = toutes activées
  wordCompletedEnabled: boolean;
  // Contributeurs
  wordAssignedEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  sessionReminderEnabled: true,
  sessionReminderLanguages: [], // vide = toutes les langues actives
  wordCompletedEnabled: true,
  wordAssignedEnabled: true,
};
