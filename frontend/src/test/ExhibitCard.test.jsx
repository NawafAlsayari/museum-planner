import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ExhibitCard from '../components/ExhibitCard.jsx';

const exhibit = {
  id: 'ex1',
  type: 'PROJECT',
  title: 'My Cool Project',
  description: 'A project description.',
  date: '2026-05-01T00:00:00.000Z',
  imageUrl: null,
};

describe('ExhibitCard', () => {
  it('renders the exhibit title and type label', () => {
    render(
      <MemoryRouter>
        <ExhibitCard exhibit={exhibit} />
      </MemoryRouter>
    );

    expect(screen.getByText('My Cool Project')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('A project description.')).toBeInTheDocument();
  });

  it('links to the exhibit detail page', () => {
    render(
      <MemoryRouter>
        <ExhibitCard exhibit={exhibit} />
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/exhibits/ex1');
  });
});
