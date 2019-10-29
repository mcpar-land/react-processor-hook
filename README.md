# `react-processor-hook`

`useProcessor` is a React hook for processing data in steps, and exposing the currently calculating step as a state.

Once all steps are complete, the final result will be reflected in `output`.


```JSX
import React from 'react';
import { useProcessor } from 'react-processor-hook';

const TweetLoader = (props) => {

  const {
    output,
    complete,
    error,
    step,
    stepIndex
  } = useProcessor([
    ["Loading tweets...", async () => {
      //
      // ... fetch tweets from api
      //
      return tweets;
    }],
    ["Sorting by likes...", async tweets => {
      //
      // ... use some algorithm to sort tweets
      //
      return sortedTweets
    }],
    ["Saving to disc...", async sortedTweets => {
      //
      // ... save tweets to disc
      //
      return sortedTweets
    }]
  ]);

  if(!complete || error) {
    return (
      <div>
        <h2>Loading...</h2>
        <h3>{step}</h3>
        {error ? <p>{error}</p> : null}
      </div>
    );
  } else {
    return (
      <div>
        {
          output.forEach((tweet, index) => {
            return <Tweet data={tweet} key={index} />;
          })
        }
      </div>
    );
  }
}

export default TweetLoader;
```
