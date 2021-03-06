/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import { AppTheme } from '@self/lib/types';
import { useMachine } from '@xstate/react';
import { gsap } from 'gsap';
import { useRef } from 'react';
import { assign, Machine } from 'xstate';
import ImageWithAspectRatio from './ImageWithAspectRatio';

interface Context {
  numberOfSlides: number;
  currentSlide: number;
}

interface State {
  states: {
    focus: {
      states: {
        focused: {};
        blured: {};
      };
    };
    activity: {
      states: {
        idle: {};
        changing: {};
      };
    };
  };
}

type Event =
  | { type: 'FOCUS' }
  | { type: 'BLUR' }
  | { type: 'CHANGE_SLIDE'; payload: number }
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREV_SLIDE' }
  | { type: 'FIRST_SLIDE' }
  | { type: 'LAST_SLIDE' };

interface Props {
  assets: string[];
}

let carouselMachine = Machine<Context, State, Event>({
  id: 'carousel',
  context: {
    numberOfSlides: null,
    currentSlide: null,
  },
  type: 'parallel',
  states: {
    focus: {
      initial: 'blured',
      states: {
        blured: {
          on: {
            FOCUS: 'focused',
          },
        },
        focused: {
          invoke: {
            src: 'bindKeyboardListener',
          },
          on: {
            BLUR: 'blured',
          },
        },
      },
    },
    activity: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            NEXT_SLIDE: { target: 'changing' },
            PREV_SLIDE: { target: 'changing' },
            FIRST_SLIDE: { target: 'changing' },
            LAST_SLIDE: { target: 'changing' },
            CHANGE_SLIDE: { target: 'changing', cond: 'inBoundaries' },
          },
        },
        changing: {
          entry: ['centerView'],
          invoke: {
            src: 'changeSlide',
            onDone: {
              target: 'idle',
              actions: 'setSlide',
            },
          },
        },
      },
    },
  },
});

function Carousel(props: Props) {
  let { assets } = props;
  let rootElementRef = useRef<HTMLDivElement>();
  let [state, send] = useMachine(carouselMachine, {
    actions: {
      setSlide: assign<Context>({ currentSlide: (_, event) => event.data }),
      centerView() {
        if (rootElementRef.current) {
          let position = {
            top: window.scrollY,
            left: rootElementRef.current.offsetLeft,
          };
          gsap.to(position, {
            duration: 0.3,
            top: rootElementRef.current.offsetTop,
            onUpdate() {
              window.scrollTo(position);
            },
          });
        }
      },
    },
    context: { numberOfSlides: assets.length, currentSlide: 0 },
    services: {
      changeSlide,
      bindKeyboardListener(context, event) {
        function keyboardListener(event: KeyboardEvent) {
          switch (event.key) {
            case 'ArrowUp':
            case 'ArrowRight':
              event.preventDefault();
              return event.shiftKey ? send('LAST_SLIDE') : send('NEXT_SLIDE');
            case 'ArrowDown':
            case 'ArrowLeft':
              event.preventDefault();
              return event.shiftKey ? send('FIRST_SLIDE') : send('PREV_SLIDE');
            default:
              return;
          }
        }

        return () => {
          window.addEventListener('keydown', keyboardListener);
          return () => window.removeEventListener('keydown', keyboardListener);
        };
      },
    },
    guards: { inBoundaries },
  });
  let { currentSlide } = state.context;

  function handleClick(index: number) {
    send('CHANGE_SLIDE', { payload: index });
  }

  function handleMouseEnter() {
    send('FOCUS');
  }

  function handleMouseLeave() {
    send('BLUR');
  }

  return (
    <div
      onClick={handleMouseEnter}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={rootElementRef}
    >
      <div css={viewportStyles}>
        <ul
          css={[
            slidesStyles,
            css`
              transform: translate(
                ${currentSlide === 0 ? '0' : `-${currentSlide * 100}%`}
              );
            `,
          ]}
        >
          {assets.map((asset, index) => (
            <li key={index}>
              <ImageWithAspectRatio
                width={800}
                height={600}
                alt="slide"
                src={asset}
              ></ImageWithAspectRatio>
            </li>
          ))}
        </ul>
      </div>

      {assets.length > 1 && (
        <ul css={listStyles}>
          {assets.map((asset, index) => (
            <li css={listItemStyles} key={`${index}`}>
              <input
                id={`slide-${index}`}
                type="radio"
                name="slide"
                defaultChecked={currentSlide === index}
                onClick={() => handleClick(index)}
                css={inputStyles}
              />
              <label htmlFor={`slide-${index}`} css={labelStyles}>
                <ImageWithAspectRatio
                  width={800}
                  height={600}
                  src={asset}
                  alt="Image"
                  css={imageStyles}
                ></ImageWithAspectRatio>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function changeSlide(context: Context, event: Event) {
  let { numberOfSlides, currentSlide } = context;

  return new Promise((res, rej) => {
    switch (event.type) {
      case 'NEXT_SLIDE':
        return res((currentSlide + 1 + numberOfSlides) % numberOfSlides);
      case 'PREV_SLIDE':
        return res((currentSlide - 1 + numberOfSlides) % numberOfSlides);
      case 'FIRST_SLIDE':
        return res(0);
      case 'LAST_SLIDE':
        return res(numberOfSlides - 1);
      case 'CHANGE_SLIDE':
        return res(event.payload);
      default:
        return rej('Unknown event');
    }
  });
}

function inBoundaries(context: Context, event: Event) {
  if (event.type === 'CHANGE_SLIDE') {
    return context.numberOfSlides - 1 >= event.payload;
  }
}

const viewportStyles = css`
  overflow-x: hidden;
`;

const slidesStyles = css`
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  transition: transform 0.3s ease-out;

  & > li {
    flex: 1 0 100%;

    & > img {
      width: 100%;
    }
  }
`;

const listStyles = css`
  display: flex;
  justify-content: center;
  padding: 0;
  margin: 0;
  list-style: none;
`;

const listItemStyles = css`
  flex: 1 auto;
  max-width: 120px;
`;

const imageStyles = css`
  width: 100%;
`;

const inputStyles = (theme: AppTheme) => css`
  display: none;

  &[checked] + label {
    border-color: ${theme.colors.textEm};
  }
`;

const labelStyles = css`
  display: block;
  line-height: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
`;

export default Carousel;
