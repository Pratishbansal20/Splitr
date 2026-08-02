import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

test('renders a Logout button', () => {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <LogoutButton />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
  expect(screen.getByText('Logout')).toBeInTheDocument();
});
