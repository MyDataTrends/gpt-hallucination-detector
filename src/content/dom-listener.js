// Import necessary utilities
import { debounce } from '../utils/timing-util';
import { logInfo } from '../utils/logging';

/**
 * Initializes a DOM listener to detect GPT response rendering events.
 * Observes the DOM for changes in GPT-generated message containers and notifies downstream consumers.
 */
export function initializeDomListener(callback) {
    // Selectors and constants
    const GPT_MESSAGE_CONTAINER_SELECTOR = '.gpt-message-container';
    const DEBOUNCE_DELAY = 500; // Delay in ms to determine rendering completion

    // State tracking
    let renderingStartTime = null;
    let renderingEndTime = null;

    // Debounced function to handle rendering completion
    const handleRenderingComplete = debounce(() => {
        renderingEndTime = new Date();
        logInfo('Rendering complete', { start: renderingStartTime, end: renderingEndTime });

        // Notify downstream consumers
        callback({
            startTime: renderingStartTime,
            endTime: renderingEndTime
        });

        // Reset state
        renderingStartTime = null;
        renderingEndTime = null;
    }, DEBOUNCE_DELAY);

    // Mutation observer callback
    const observerCallback = (mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const addedNode of mutation.addedNodes) {
                    if (addedNode.matches && addedNode.matches(GPT_MESSAGE_CONTAINER_SELECTOR)) {
                        if (!renderingStartTime) {
                            renderingStartTime = new Date();
                            logInfo('Rendering started', { start: renderingStartTime });
                        }

                        // Reset debounce timer on new content
                        handleRenderingComplete();
                    }
                }
            }
        }
    };

    // Initialize observer
    const observer = new MutationObserver(observerCallback);

    // Function to attach observer to the DOM
    const attachObserver = () => {
        const targetNode = document.querySelector('body');
        if (targetNode) {
            observer.observe(targetNode, {
                childList: true,
                subtree: true
            });
            logInfo('Observer attached to DOM');
        } else {
            logInfo('Target node not found, retrying...');
            setTimeout(attachObserver, 1000); // Retry after 1 second
        }
    };

    // Attach observer initially
    attachObserver();

    // Return a cleanup function to disconnect the observer
    return () => {
        observer.disconnect();
        logInfo('Observer disconnected');
    };
}