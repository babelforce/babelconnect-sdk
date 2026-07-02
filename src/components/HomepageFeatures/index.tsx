import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'TypeScript SDK',
    Svg: require('@site/static/img/feature-browser.svg').default,
    description: (
      <>
        <code>@babelforce/babelconnect-sdk</code> — a typed gRPC-web client with native WebRTC audio for
        browser softphone &amp; CTI apps, plus an embeddable <code>/embed</code> widget you drive from
        your CRM.
      </>
    ),
  },
  {
    title: 'Go SDK',
    Svg: require('@site/static/img/feature-terminal.svg').default,
    description: (
      <>
        <code>go get github.com/babelforce/babelconnect-sdk-go</code> — the same server-authoritative
        client for back-end and terminal apps, with a pluggable media leg.
      </>
    ),
  },
  {
    title: 'Open contract',
    Svg: require('@site/static/img/feature-contract.svg').default,
    description: (
      <>
        One <code>babelconnect.v1</code> gRPC contract, projected to REST/OpenAPI and generated SDK
        types. Your UI is a pure function of <code>AgentView</code>; you send typed intents.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
