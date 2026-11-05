using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Controllers
{
    public class CursoController
    {
        Curso cursoClass = new Curso();

        public void InsertCurso(int _idEscola)
        {
            try
            {
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("insert into cursos(nome, idEscola) values(@Nome, @IdEscola)", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@Nome", cursoClass.Name);
                Banco.Command.Parameters.AddWithValue("@idEscola", _idEscola);
                Banco.Command.ExecuteNonQuery();
                //Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Inserir Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public DataTable ListCourses(int _idEscola)
        {
            try
            {
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("select id, nome from cursos where idEscola=@idEscola", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@idEscola", _idEscola);
                Banco.DataAdapter = new MySqlDataAdapter(Banco.Command);
                Banco.datTable = new DataTable();
                Banco.DataAdapter.Fill(Banco.datTable);
                //Banco.CloseConnection();
                return Banco.datTable;
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Listar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return null;
            }
        }

        public void DeleteCursos()
        {
            try
            {
                //Banco.OpenConnection();
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("delete from cursos where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", cursoClass.Id);
                Banco.Command.ExecuteNonQuery();
                //Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Deletar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void UpdateCursos()
        {
            try
            {
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("update Alunos set nome = @nome where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", cursoClass.Id);
                Banco.Command.ExecuteNonQuery();
                //Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Atualizar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
