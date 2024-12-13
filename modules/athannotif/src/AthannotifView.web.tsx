import * as React from 'react';

import { AthannotifViewProps } from './Athannotif.types';

export default function AthannotifView(props: AthannotifViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
