importClass(Packages.java.util.concurrent.ArrayBlockingQueue);

/**
 * This file defines the life cycle hooks for the Integration Service JS
 */

var keepThreadAlive = true;
var shouldContinue = true;
var thread = null;

// Create an instance of a thread-safe blocking queue that waits for the queue
// to become non-empty when retrieving an element, and waits for space to become 
// available in the queue when storing an element
var queue = new ArrayBlockingQueue(100);

/**
 * This is the method called when the Integration Agent starts
 * this Integration Service.
 * 
 * <p>
 * For the BMC Remedy integration we will start the thread which makes periodic
 * checks of the data load queue to see if there is a new data load to be
 * handled
 */
function apia_startup()
{
  log.debug("Entered Startup Hook.");
  thread = spawn(queueConsumer);
  return true;
}

/**
 * This is the method called when the Integration Agent shut down
 * this Integration Service.
 * <p>
 * For the BMC Remedy integration we will stop the thread that is processing
 * the data load. This will result in data loads that are currently queued being
 * lost
 */
function apia_shutdown()
{
  log.debug("Entered Shutdown Hook.");
  shouldContinue = false;
  keepThreadAlive = false;
  return true;
}

/**
 * This is the method called when the Integration Agent suspends
 * this Integration Service. For example when the below command is executed.
 *   iadmin.sh suspend hpnnmi
 * <p>
 * For the BMC Remedy integration we will suspend the thread that is processing
 * the data load.
 */
function apia_suspend()
{
  log.debug("Entered Suspend Hook.");
  shouldContinue = false;
  apia_interrupt();
  return true;
}

/**
 * This is the method called when the Integration Agent suspends
 * this Integration Service. For example when the below command is executed.
 *   iadmin.sh resume hpnnmi
 * <p>
 * For the BMC Remedy integration we will resume the thread that is processing
 * the data load.
 */
function apia_resume()
{
  log.debug("Entered Resume Hook.");
  shouldContinue = true;
  return true;
}

/**
 * This is the method called when the Integration Agent interrupts
 * this Integration Service. For example when the below command is executed.
 *   iadmin.sh suspend-now 
 * <p>
 * For the BMC Remedy integration we will interrupt the thread that is processing
 * the data load. This will cause the thread to wake before the sleep duration
 * is over.
 */
function apia_interrupt()
{
  log.debug("Entered Interrupt Hook.");
  if (thread != null)
  {
    thread.interrupt();
  }
  return true;
}

/**
 * New lifecycle method not used in this integration
 */
function apia_webservice_init() {}
