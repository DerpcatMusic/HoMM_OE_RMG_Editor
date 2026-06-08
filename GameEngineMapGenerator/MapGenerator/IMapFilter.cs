namespace Hex.MapGenerator;

public interface IMapFilter
{
	bool IsValid(int index);

	void GrabValue(int index);
}
