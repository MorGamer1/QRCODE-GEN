import { render, screen } from '@testing-library/react';
import { PasswordRequirements } from './password-requirements';

describe('PasswordRequirements', () => {
  it('shows all four rules as unmet for an empty password', () => {
    render(<PasswordRequirements value="" />);
    expect(screen.getByText('At least 8 characters')).toHaveClass('text-muted-foreground');
    expect(screen.getByText('A lowercase letter')).toHaveClass('text-muted-foreground');
    expect(screen.getByText('An uppercase letter')).toHaveClass('text-muted-foreground');
    expect(screen.getByText('A number')).toHaveClass('text-muted-foreground');
  });

  it('marks only the satisfied rules as met', () => {
    // Lowercase + long enough, but no uppercase and no digit.
    render(<PasswordRequirements value="onlylowercase" />);
    expect(screen.getByText('At least 8 characters')).toHaveClass('text-success');
    expect(screen.getByText('A lowercase letter')).toHaveClass('text-success');
    expect(screen.getByText('An uppercase letter')).toHaveClass('text-muted-foreground');
    expect(screen.getByText('A number')).toHaveClass('text-muted-foreground');
  });

  it('marks every rule as met for a fully valid password', () => {
    render(<PasswordRequirements value="CorrectHorse123" />);
    for (const label of ['At least 8 characters', 'A lowercase letter', 'An uppercase letter', 'A number']) {
      expect(screen.getByText(label)).toHaveClass('text-success');
    }
  });

  it('requires strictly more than 7 characters (matches PASSWORD_MIN_LENGTH = 8)', () => {
    render(<PasswordRequirements value="Ab1234567" />);
    expect(screen.getByText('At least 8 characters')).toHaveClass('text-success');
  });
});
