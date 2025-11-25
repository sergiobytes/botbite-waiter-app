export const downloadTemplate = (templateName: string) => {
  const url = `/templates/${templateName}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = templateName;
  a.click();
};
