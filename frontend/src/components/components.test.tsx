import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';

import { BilingualField } from '../admin/components/form';
import { ZoneEditor } from '../admin/components/ZoneEditor';
import type { EtapeInput, LocalizedText } from '../lib/types';
import { TourPlayer } from './demo/TourPlayer';
import { ProjectBadges } from './ProjectBadges';

const STEPS: EtapeInput[] = [
  {
    image_url: '/uploads/1.png',
    zone: { x: 10, y: 20, largeur: 30, hauteur: 15 },
    legende: { fr: 'Ouvrez le menu', en: 'Open the menu' },
  },
  { image_url: '/uploads/2.png', zone: null, legende: { fr: 'Choisissez un trajet', en: '' } },
  {
    image_url: '/uploads/3.png',
    zone: { x: 0, y: 0, largeur: 50, hauteur: 50 },
    legende: { fr: 'Confirmez', en: 'Confirm' },
  },
];

describe('TourPlayer', () => {
  test('la zone cliquable est placée en % et mène à l’écran suivant', async () => {
    render(<TourPlayer etapes={STEPS} cadre="navigateur" />);
    expect(screen.getByText('Ouvrez le menu')).toBeInTheDocument();
    expect(screen.getByText('Étape 1 sur 3')).toBeInTheDocument();

    const hotspot = screen.getByRole('button', { name: /Zone à cliquer/ });
    expect(hotspot).toHaveStyle({ left: '10%', top: '20%', width: '30%', height: '15%' });
    await userEvent.click(hotspot);

    expect(screen.getByText('Choisissez un trajet')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    // Étape sans zone : pas de zone cliquable, on avance avec « Suivant ».
    expect(screen.queryByRole('button', { name: /Zone à cliquer/ })).not.toBeInTheDocument();
  });

  test('boutons Précédent / Suivant et retour au début', async () => {
    render(<TourPlayer etapes={STEPS} cadre="telephone" />);
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText('Confirmez')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Recommencer' })[0]!);
    expect(screen.getByText('Ouvrez le menu')).toBeInTheDocument();
  });

  test('navigation au clavier avec les flèches', () => {
    render(<TourPlayer etapes={STEPS} cadre="aucun" />);
    const tour = screen.getByRole('region', { name: 'Visite guidée interactive' });
    fireEvent.keyDown(tour, { key: 'ArrowRight' });
    expect(screen.getByText('Étape 2 sur 3')).toBeInTheDocument();
    fireEvent.keyDown(tour, { key: 'ArrowLeft' });
    fireEvent.keyDown(tour, { key: 'ArrowLeft' });
    expect(screen.getByText('Étape 1 sur 3')).toBeInTheDocument();
  });

  test('visite sans étape', () => {
    render(<TourPlayer etapes={[]} cadre="aucun" />);
    expect(screen.getByText(/pas encore d'écran/)).toBeInTheDocument();
  });
});

describe('ProjectBadges', () => {
  test('affiche les 3 badges indépendants : Code, État, Démo', () => {
    render(
      <ProjectBadges
        projet={{
          acces_code: 'confidentiel',
          etat: 'en_cours',
          niveau_demo: 3,
          types_demo: ['visite', 'video'],
        }}
      />,
    );
    const badges = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(badges).toEqual(['CodeConfidentiel (client)', 'ÉtatEn cours', 'DémoVisite guidée']);
  });
});

describe('BilingualField', () => {
  function Form({ onSubmit }: { onSubmit: (values: { titre: LocalizedText }) => void }) {
    const { register, handleSubmit } = useForm<{ titre: LocalizedText }>({
      defaultValues: { titre: { fr: 'Bonjour', en: '' } },
    });
    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <BilingualField label="Titre" name="titre" register={register} />
        <button type="submit">ok</button>
      </form>
    );
  }

  test('affiche les champs FR et EN côte à côte et renvoie les deux valeurs', async () => {
    const onSubmit = vi.fn();
    render(<Form onSubmit={onSubmit} />);
    const french = screen.getByLabelText('Français');
    const english = screen.getByLabelText('Anglais');
    expect(french).toHaveValue('Bonjour');
    expect(french.closest('.grid')).toBe(english.closest('.grid'));
    expect(screen.getByRole('group', { name: 'Titre' })).toBeInTheDocument();

    await userEvent.type(english, 'Hello');
    await userEvent.click(screen.getByRole('button', { name: 'ok' }));
    expect(onSubmit.mock.calls[0]![0]).toEqual({ titre: { fr: 'Bonjour', en: 'Hello' } });
  });
});

describe('ZoneEditor', () => {
  function setup(zone = null as Parameters<typeof ZoneEditor>[0]['zone']) {
    const onChange = vi.fn();
    render(<ZoneEditor imageUrl="/uploads/1.png" alt="Étape 1" zone={zone} onChange={onChange} />);
    const surface = screen.getByTestId('zone-surface');
    // jsdom ne calcule pas la mise en page : on fixe la taille de la capture à l'écran.
    surface.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 400 }) as DOMRect;
    surface.setPointerCapture = vi.fn();
    return { onChange, surface };
  }

  test('tracer un rectangle à la souris donne une zone en % de l’image', () => {
    const { onChange, surface } = setup();
    fireEvent.pointerDown(surface, { clientX: 80, clientY: 40, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 400, clientY: 200, pointerId: 1 });
    expect(screen.getByTestId('zone-rectangle')).toHaveStyle({ left: '10%', width: '40%' });
    fireEvent.pointerUp(surface, { pointerId: 1 });
    expect(onChange).toHaveBeenCalledWith({ x: 10, y: 10, largeur: 40, hauteur: 40 });
  });

  test('un simple clic ne modifie pas la zone', () => {
    const { onChange, surface } = setup();
    fireEvent.pointerDown(surface, { clientX: 80, clientY: 40, pointerId: 1 });
    fireEvent.pointerUp(surface, { pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
  });

  test('réglage au clavier et effacement', async () => {
    const { onChange } = setup({ x: 10, y: 10, largeur: 20, hauteur: 20 });
    fireEvent.change(screen.getByLabelText('Largeur'), { target: { value: '95' } });
    expect(onChange).toHaveBeenLastCalledWith({ x: 5, y: 10, largeur: 95, hauteur: 20 });
    await userEvent.click(screen.getByRole('button', { name: 'Effacer la zone' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
