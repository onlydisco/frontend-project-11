const generateId = () => {
  let counter = 0;

  return () => {
    counter += 1;
    const id = counter;
    return id;
  };
};

export default generateId;
