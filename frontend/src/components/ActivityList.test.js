import { render, screen } from '@testing-library/react';
import ActivityList from './ActivityList';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 'user-bob', name: 'Bob', email: 'bob@example.com' }));
  localStorage.setItem('token', 'fake-token');
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('renders the correct "You owe" amount for a non-payer (regression: split.user is a populated object, not an id string)', async () => {
  api.get.mockResolvedValueOnce({
    data: [
      {
        _id: 'exp-1',
        type: 'EXPENSE',
        description: 'Dinner',
        amount: 100,
        amountCents: 10000,
        createdAt: new Date().toISOString(),
        group: { name: 'Trip' },
        paidBy: { _id: 'user-alice', name: 'Alice' },
        split: [
          { user: { _id: 'user-alice', name: 'Alice' }, share: 50, shareCents: 5000 },
          { user: { _id: 'user-bob', name: 'Bob' }, share: 50, shareCents: 5000 },
        ],
      },
    ],
  });

  render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ActivityList />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );

  expect(await screen.findByText('You owe ₹50.00')).toBeInTheDocument();
});
