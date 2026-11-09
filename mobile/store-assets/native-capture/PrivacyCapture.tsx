import { ConsentChoice } from '../../App.native';

// The consent screen is the production component; only the choice callback is capture-local.
export function PrivacyCapture({ onChoose }: { onChoose: () => void }) {
  return <ConsentChoice saving={false} onChoose={() => onChoose()} />;
}
