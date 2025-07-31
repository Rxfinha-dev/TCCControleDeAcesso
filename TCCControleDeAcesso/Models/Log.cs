using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MySql.Data.MySqlClient;

namespace TCCControleDeAcesso.Models
{
    public class Log
    {
        public void insert(int idAluno, DateTime dataEntrada, int idEscola)
        {
            try {
                Banco.OpenConnection();
                Banco.Command = new MySqlCommand("insert into entrada(idAluno, dataEntrada, idEscola) values (@idAluno, @dataEntrada, @idEscola)", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@idAluno", idAluno);
                Banco.Command.Parameters.AddWithValue("@dataEntrada", dataEntrada);
                Banco.Command.Parameters.AddWithValue("@idEscola", idEscola);
                Banco.Command.ExecuteNonQuery();
                Banco.CloseConnection();
            }catch (Exception e)
			{
				MessageBox.Show(e.Message, "Erro Ao Inserir Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
			}
		}

        public DataTable ShowLog(int idEscola) {
            try
            {
				Banco.OpenConnection();
				Banco.Command = new MySqlCommand("select * from entradas where idEscola=@idEscola", Banco.Connection);
				Banco.Command.Parameters.AddWithValue("@idEscola", idEscola);
				Banco.DataAdapter = new MySqlDataAdapter(Banco.Command);
				Banco.datTable = new DataTable();
				Banco.DataAdapter.Fill(Banco.datTable);
				Banco.CloseConnection();
				return Banco.datTable;
			}
			catch (Exception e)
			{
				MessageBox.Show(e.Message, "Erro Ao Listar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
				return null;
			}
			 

		}
    }
}
