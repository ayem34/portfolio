import { render, screen } from '@testing-library/react';

import App from './App';

test('affiche le libellé traduit', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Site en cours de construction',
  );
});
