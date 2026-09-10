import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/AppRouter';

export default function App(): JSX.Element {
  return <AppProviders><AppRouter /></AppProviders>;
}
