import { FC, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const builtInPermissions = [
  "https://bitbucket.org/*",
  "https://gist.github.com/*",
  "https://gitlab.com/*",
  "https://github.com/*",
];

const Options: FC = () => {
  const [origins, setOrigins] = useState<string[]>([]);
  const [temp, setTemp] = useState("");

  useEffect(() => {
    chrome.permissions.getAll(({ origins = [] }) => {
      setOrigins(origins);
    });
  }, []);

  return (
    <div style={{ lineHeight: "1.8" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!temp) {
            alert("fail");
            return;
          }
          chrome.permissions.request({ origins: [temp] }, (granted) => {
            if (granted) {
              chrome.permissions.getAll(({ origins = [] }) => {
                setOrigins(origins);
                setTemp("");
              });
            }
          });
        }}
      >
        <p>
          Add permissions here if your GitHub/Gitlab/Bitbucket is hosted on a different site. If it doesn't work, see
          {" "}
          <a target="_blank" href="https://developer.chrome.com/extensions/match_patterns">
            Match Patterns
          </a>
        </p>
        <table>
          <thead />
          <tbody>
            <tr>
              <td>
                <input
                  style={{ minWidth: "200px" }}
                  type="text"
                  value={temp}
                  onChange={(e) => {
                    setTemp((e.target as HTMLInputElement).value);
                  }}
                  placeholder="https://www.example.com/*"
                />
              </td>
              <td>
                <button type="submit">Add</button>
              </td>
            </tr>
            {origins.map((item) => (
              <tr key={item}>
                <td style={{ minWidth: "220px" }}>{item}</td>
                <td>
                  {builtInPermissions.includes(item) || (
                    <a
                      href="#"
                      onClick={() => {
                        chrome.permissions.remove({ origins: [item] }, (removed) => {
                          if (removed) {
                            chrome.permissions.getAll(({ origins = [] }) => {
                              setOrigins(origins);
                            });
                          }
                        });
                      }}
                    >
                      Remove
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </form>
      <hr />
      <footer>
        <a target="_blank" href="https://github.com/pd4d10/octohint">
          Source code
        </a>
        <br />
        <a target="_blank" href="https://github.com/pd4d10/octohint/issues/new">
          Submit an issue
        </a>
      </footer>
    </div>
  );
};

const container = document.createElement("div");
document.body.appendChild(container);
createRoot(container).render(<Options />);
