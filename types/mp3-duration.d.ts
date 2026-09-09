declare module 'mp3-duration' {
  /**
   * Computes the duration of an mp3 (ID3 + CBR/VBR aware) from a file path
   * or an in-memory Buffer. Returns a promise when no callback is given.
   */
  function getDuration(source: string | Buffer, callback?: (duration: number) => void): Promise<number>;

  export default getDuration;
}
