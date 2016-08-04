import React from 'react';
import Radium from 'radium';

@Radium
export default class DropdownMenu extends React.Component {
  displayName = 'Dropdown menu items'

  static propTypes = {
    menuItems: React.PropTypes.array,
    style: React.PropTypes.object,
    menuItemStyle: React.PropTypes.object,
    open: React.PropTypes.bool
  }

  getStyles = () => {
    const {open, active} = this.props;
    let styles = {
      menu: {
        position: 'absolute',
        top: '100%',
        left: '0',
        zIndex: '1000',
        float: 'left',
        minWidth: '160px',
        margin: '0px',
        padding: '5px 0px',
        fontSize: '14px',
        textAlign: 'left',
        listStyle: 'none',
        backgroundColor: '#fff',
        backgroundClip: 'padding-box',
        border: '1px solid #ccc',
        borderBottomLeftRadius: '2px',
        borderBottomRightRadius: '2px',
        boxShadow: '0 6px 12px #C9C9C9',
        boxSizing: 'border-box',

        '@media (max-width: 767px)': {
          position: 'static',
          float: 'none',
          width: 'auto',
          marginTop: '0',
          backgroundColor: 'transparent',
          border: '0',
          boxShadow: 'none'
        }
        },
        link: {
          display: 'block',
          padding: '3px 20px',
          clear: 'both',
          fontWeight: 'normal',
          lineHeight: '1.42857143',
          color: '#333',
          whiteSpace: 'nowrap',
          textDecoration: 'none',
          boxSizing: 'border-box',

          ':hover': {
            color: '#262626',
            backgroundColor: '#f5f5f5'
          },

          ':focus': {
              color: '#262626',
              backgroundColor: '#f5f5f5'
          },

          '@media (max-width: 767px)': {
            backgroundColor: 'transparent',
            color: '#777',

            ':hover': {
              color: '#333',
              backgroundColor: 'transparent'
            }
          }
        }
      };
    if (active) {
      styles.menu.display = open ? 'block' : 'none';
    } else {
      styles.menu.display = 'none';
    }
  return styles;
  }

  render() {
    const defStyle = this.getStyles();
    const {menuItems, style, menuItemStyle} = this.props;

    var lastChildArray = [];
    _.times(menuItems.length-1, function(){
      lastChildArray.push({})
    });
    lastChildArray.push({ 'border-top': '1px solid #999' })


    return (
      <ul style={[defStyle.menu, style && style]}>
        {menuItems.map((item, i) => {
          return (
            <span key={i+200}>
              <li key={i+100} style={lastChildArray[i]} ></li>
              <li key={i}>
                <a key={item.name} style={[defStyle.link, menuItemStyle && menuItemStyle] }
                  href={item.href}>{item.name}
                </a>
              </li>
            </span>
          );
        })}
      </ul>
    );
  }
}
