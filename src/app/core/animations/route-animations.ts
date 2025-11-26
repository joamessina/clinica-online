import {
  trigger,
  transition,
  style,
  animate,
  query,
  group,
} from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('LoginPage <=> *', [
    commonPositionStyles(),
    group([
      query(
        ':leave',
        [
          animate(
            '150ms ease-out',
            style({
              opacity: 0,
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({
            opacity: 0,
            transform: 'scale(0.96)',
          }),
          animate(
            '220ms ease-out',
            style({
              opacity: 1,
              transform: 'scale(1)',
            })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),

  transition('SolicitarTurnoPage <=> *', [
    commonPositionStyles(),
    group([
      query(
        ':leave',
        [
          animate(
            '180ms ease-out',
            style({
              opacity: 0,
              transform: 'translateY(-10px)',
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({
            opacity: 0,
            transform: 'translateY(20px)',
          }),
          animate(
            '220ms ease-out',
            style({
              opacity: 1,
              transform: 'translateY(0)',
            })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),

  transition('MisTurnosPage <=> *', [
    commonPositionStyles(),
    group([
      query(
        ':leave',
        [
          animate(
            '180ms ease-out',
            style({
              opacity: 0,
              transform: 'perspective(800px) rotateY(5deg)',
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({
            opacity: 0,
            transform: 'perspective(800px) rotateY(-8deg)',
          }),
          animate(
            '230ms ease-out',
            style({
              opacity: 1,
              transform: 'perspective(800px) rotateY(0deg)',
            })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),

  transition('HomePage <=> *', [
    commonPositionStyles(),
    group([
      query(
        ':leave',
        [animate('150ms ease-out', style({ opacity: 0 }))],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({ opacity: 0 }),
          animate('180ms ease-out', style({ opacity: 1 })),
        ],
        { optional: true }
      ),
    ]),
  ]),

  transition('AdminDashboardPage <=> *', [
    commonPositionStyles(),
    group([
      query(
        ':leave',
        [
          animate(
            '180ms ease-out',
            style({
              opacity: 0,
              transform: 'translateX(-10px)',
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({
            opacity: 0,
            transform: 'translateX(15px)',
          }),
          animate(
            '220ms ease-out',
            style({
              opacity: 1,
              transform: 'translateX(0)',
            })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),

  transition('DetallePage <=> *', [
    commonPositionStyles(),
    group([
      query(
        ':leave',
        [
          animate(
            '130ms ease-out',
            style({
              opacity: 0,
              transform: 'scale(0.98)',
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({
            opacity: 0,
            transform: 'scale(0.95)',
          }),
          animate(
            '200ms ease-out',
            style({
              opacity: 1,
              transform: 'scale(1)',
            })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);

function commonPositionStyles() {
  return query(
    ':enter, :leave',
    [
      style({
        position: 'absolute',
        width: '100%',
        top: 0,
        left: 0,
      }),
    ],
    { optional: true }
  );
}
