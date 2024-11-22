const React = require('react');
const Svg = require('react-native-svg').default;
const { Path } = require('react-native-svg');

class PiBellSimpleSlash extends React.Component {
  render() {
    const { color = 'currentColor', size = 24, ...props } = this.props;
    return (
      <Svg 
        viewBox="0 0 256 256" 
        fill={color} 
        height={size} 
        width={size} 
        {...props}
      >
        <Path 
          fill={color}
          d="M53.92,34.62A8,8,0,1,0,42.08,45.38L58.82,63.8A79.59,79.59,0,0,0,48,104c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H182.64l19.44,21.38a8,8,0,1,0,11.84-10.76ZM48,184c7.7-13.24,16-43.92,16-80a63.65,63.65,0,0,1,6.26-27.62L168.09,184Zm120,40a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,224Zm46-44.75a8.13,8.13,0,0,1-2.93.55,8,8,0,0,1-7.44-5.08C196.35,156.19,192,129.75,192,104A64,64,0,0,0,96.43,48.31a8,8,0,0,1-7.9-13.91A80,80,0,0,1,208,104c0,35.35,8.05,58.59,10.52,64.88A8,8,0,0,1,214,179.25Z"
        />
      </Svg>
    );
  }
}

class PiBellSimpleRinging extends React.Component {
  render() {
    const { color = 'currentColor', size = 24, ...props } = this.props;
    return (
      <Svg 
        viewBox="0 0 256 256" 
        fill={color} 
        height={size} 
        width={size} 
        {...props}
      >
        <Path 
          fill={color}
          d="M168,224a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,224ZM227.39,60.32a111.36,111.36,0,0,0-39.12-43.08,8,8,0,1,0-8.54,13.53,94.13,94.13,0,0,1,33.46,36.91,8,8,0,0,0,14.2-7.36ZM35.71,72a8,8,0,0,0,7.1-4.32A94.13,94.13,0,0,1,76.27,30.77a8,8,0,1,0-8.54-13.53A111.36,111.36,0,0,0,28.61,60.32,8,8,0,0,0,35.71,72Zm186.1,103.94A16,16,0,0,1,208,200H48a16,16,0,0,1-13.79-24.06C43.22,160.39,48,138.28,48,112a80,80,0,0,1,160,0C208,138.27,212.78,160.38,221.81,175.94ZM208,184c-10.64-18.27-16-42.49-16-72a64,64,0,0,0-128,0c0,29.52-5.38,53.74-16,72Z"
        />
      </Svg>
    );
  }
}

class PiVibrate extends React.Component {
  render() {
    const { color = 'currentColor', size = 24, ...props } = this.props;
    return (
      <Svg 
        viewBox="0 0 256 256" 
        fill={color} 
        height={size} 
        width={size} 
        {...props}
      >
        <Path 
          fill={color}
          d="M160,32H96A24,24,0,0,0,72,56V200a24,24,0,0,0,24,24h64a24,24,0,0,0,24-24V56A24,24,0,0,0,160,32Zm8,168a8,8,0,0,1-8,8H96a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8h64a8,8,0,0,1,8,8ZM216,88v80a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Zm32,16v48a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0ZM56,88v80a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0ZM24,104v48a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"
        />
      </Svg>
    );
  }
}

class PiSpeakerSimpleHigh extends React.Component {
  render() {
    const { color = 'currentColor', size = 24, ...props } = this.props;
    return (
      <Svg 
        viewBox="0 0 256 256" 
        fill={color} 
        height={size} 
        width={size} 
        {...props}
      >
        <Path 
          fill={color}
          d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM144,207.64,84.91,161.69A7.94,7.94,0,0,0,80,160H32V96H80a7.94,7.94,0,0,0,4.91-1.69L144,48.36ZM200,104v48a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm32-16v80a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z"
        />
      </Svg>
    );
  }
}

module.exports = {
  PiBellSimpleSlash,
  PiBellSimpleRinging,
  PiVibrate,
  PiSpeakerSimpleHigh
};