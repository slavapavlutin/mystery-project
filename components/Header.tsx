/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import ActiveLink from '@self/components/ActiveLink';
import Link from '@self/components/Link';
import { withTranslation } from '@self/i18n';
import useAuth from '@self/lib/hooks/useAuth';
import useMediaQuery from '@self/lib/hooks/useMediaQuery';
import routes from '@self/lib/routes';
import { PagePropsWithTranslation } from '@self/lib/types';
import mediaQueries from '@self/styles/mediaQueries';
import Avatar from './Avatar';
import * as styles from './Header.styles';
import Logo from './Logo';
import Menu from './Menu';

interface Props extends PagePropsWithTranslation<'header'> {}

function Header(props: Props) {
  let { t } = props;
  let [auth] = useAuth();
  let matches = useMediaQuery(mediaQueries.tablet);

  return (
    <header css={styles.header}>
      <ul css={styles.nav}>
        {auth.matches('auth') && (
          <li
            css={css`
              flex: ${matches ? -1 : 1};
              order: ${matches ? 2 : 1};
              ${matches && 'margin-right: 1rem;'}
            `}
          >
            <ActiveLink href={routes.posts.new.url} passHref>
              <a css={styles.signinLink}>Publish</a>
            </ActiveLink>
          </li>
        )}
        <li
          css={css`
            flex: ${matches ? -1 : auth.matches('auth') ? 0 : 1};
            order: ${matches ? 2 : 0};
            ${!matches && auth.matches('auth') && 'margin-right: 1rem;'}
          `}
        >
          {auth.matches('auth') ? (
            <Avatar user={auth.context.user} />
          ) : (
            <ActiveLink href="/login" passHref>
              <a css={styles.signinLink}>{t('login')}</a>
            </ActiveLink>
          )}
        </li>
        <li
          css={css`
            order: ${matches ? 0 : 1};
            ${!matches && auth.matches('auth') && 'margin-left: -1rem;'}
          `}
        >
          <Link href="/">
            <a>
              <Logo css={styles.logo} />
            </a>
          </Link>
        </li>
        <li
          css={css`
            flex: 1;
            text-align: right;
            order: ${matches ? 1 : 2};
          `}
        >
          {matches ? (
            <ul css={styles.menu}>
              <li>
                <ActiveLink href="/feed" passHref>
                  <a css={styles.link}>{t('feed')}</a>
                </ActiveLink>
              </li>
              <li>
                <ActiveLink href="/settings" passHref>
                  <a css={styles.link}>{t('settings')}</a>
                </ActiveLink>
              </li>
            </ul>
          ) : (
            <Menu t={t} user={auth.context.user} />
          )}
        </li>
      </ul>
    </header>
  );
}

// @ts-ignore
export default withTranslation('header')(Header);
