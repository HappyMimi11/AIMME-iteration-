import CategoryDocumentPage from '../CategoryDocumentPage';

export default function WaitingPage() {
  return (
    <CategoryDocumentPage
      categoryPath="non_actionables/waiting"
      title="Waiting For"
      description="Track items or tasks that are dependent on others or external factors before you can proceed."
    />
  );
}