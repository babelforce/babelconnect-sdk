import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Build your own phone',
    Svg: require('@site/static/img/feature-browser.svg').default,
    description: (
      <>
        Render live calls and send typed commands. The TypeScript SDK handles browser audio.
        {' '}<Link to="/docs/tutorial/first-softphone">Follow the tutorial →</Link>
      </>
    ),
  },
  {
    title: 'Connect a Go tool',
    Svg: require('@site/static/img/feature-terminal.svg').default,
    description: (
      <>
        Read agent state and drive calls from a terminal or service.
        {' '}<Link to="/docs/go/getting-started">Check availability and setup →</Link>
      </>
    ),
  },
  {
    title: 'Explore the contract',
    Svg: require('@site/static/img/feature-contract.svg').default,
    description: (
      <>
        Look up commands, state fields and errors, with REST and event schemas for tooling.
        {' '}<Link to="/docs/protocol/overview">Browse the references →</Link>
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
