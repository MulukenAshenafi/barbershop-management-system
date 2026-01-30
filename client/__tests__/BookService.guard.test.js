/**
 * BookService – guard when serviceId/serviceName params are missing.
 * Requires React Native test environment (run with npm run test:rn).
 */
const React = require('react');
const { render, waitFor } = require('@testing-library/react-native');
const { ThemeProvider } = require('../context/ThemeContext');
const { ToastProvider } = require('../components/common/Toast');
const BookService = require('../screens/BookService').default;

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

function AllProviders({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('BookService guard', () => {
  it('shows "Please select a service first" and Go back when params missing', async () => {
    const { getByText } = render(
      <AllProviders>
        <BookService
          route={{ params: {} }}
          navigation={mockNavigation}
        />
      </AllProviders>
    );

    await waitFor(() => {
      expect(getByText(/Please select a service first/i)).toBeTruthy();
    });
    expect(getByText('Go back')).toBeTruthy();
  });

  it('shows same guard when only barbershopId is passed', async () => {
    const { getByText } = render(
      <AllProviders>
        <BookService
          route={{ params: { barbershopId: 'shop1' } }}
          navigation={mockNavigation}
        />
      </AllProviders>
    );

    await waitFor(() => {
      expect(getByText(/Please select a service first/i)).toBeTruthy();
    });
  });
});
