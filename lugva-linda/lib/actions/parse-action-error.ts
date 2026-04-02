export const parseActionErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return 'Operation impossible.';
  }

  const [, message] = error.message.split(':');
  return message ?? error.message;
};
