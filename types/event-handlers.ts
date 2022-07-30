import { ChangeEvent } from 'react';

export type InputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => unknown;
export type ClickHandler = React.MouseEventHandler;
