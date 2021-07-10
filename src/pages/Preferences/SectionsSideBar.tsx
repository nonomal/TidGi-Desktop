import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Divider, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';

import { ISectionProps } from './useSections';
import { PreferenceSections } from '@services/preferences/interface';

const SideBar = styled.div`
  position: fixed;
  width: 200px;
  color: #666;
`;

const animateMoveFromLeft = keyframes`
  from {
    transform: translate3d(-40px, 0, 0);
    opacity: 0;
  }

  to {
    transform: translate3d(0px, 0, 0);
    opacity: 1;
  }
`;

const SideMenuListItem = styled(ListItem)<{ index: number }>`
  opacity: 0;
  animation: ${animateMoveFromLeft} 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: forwards;
  animation-delay: ${({ index }) => index * 0.05}s;
`;

export function SectionSideBar(props: ISectionProps): JSX.Element {
  return (
    <SideBar>
      <List dense>
        {Object.keys(props.sections).map((sectionKey, index) => {
          const { Icon, text, ref, hidden } = props.sections[sectionKey as PreferenceSections];
          if (hidden === true) return <></>;
          return (
            <React.Fragment key={sectionKey}>
              {index > 0 && <Divider />}
              <SideMenuListItem button index={index} onClick={() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={text} />
              </SideMenuListItem>
            </React.Fragment>
          );
        })}
      </List>
    </SideBar>
  );
}
