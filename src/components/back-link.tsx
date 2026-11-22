import Link from 'next/link'

import styles from './back-link.module.scss'

type BackLinkProps = {
  href: string,
  label: string
}

export function BackLink({
  href,
  label
}: BackLinkProps) {
  return(
    <div className={styles.backLink}>
      <Link href={href} className={styles.backLinkAnchor}>
        {label}
      </Link>
    </div>
  )
}