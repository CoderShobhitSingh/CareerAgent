import "./loading-animation.scss"

const LoadingAnimation = ({ message = "Getting things ready..." }) => (
    <main className="loading-screen" role="status" aria-live="polite">
        <div className="loading-animation" aria-hidden="true">
            <div className="loading-animation__orbit">
                <span className="loading-animation__spark loading-animation__spark--one" />
                <span className="loading-animation__spark loading-animation__spark--two" />
                <span className="loading-animation__spark loading-animation__spark--three" />
            </div>
            <div className="loading-animation__document">
                <span />
                <span />
                <span />
                <i />
            </div>
        </div>
        <p className="loading-animation__message">{message}</p>
        <div className="loading-animation__progress" aria-hidden="true">
            <span />
        </div>
    </main>
)

export default LoadingAnimation
